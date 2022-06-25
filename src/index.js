import request from "request";
import cheerio from "cheerio";
import fs from "fs";

import { BASE_URL } from "./url.js";
import { CURRENT_TEAMS } from "./teams.js";
import { OLD_TEAM_NAMES } from "./teams.js";
import { player } from "./player.js";
import { teamNamePrettier } from "./util.js";

const historic = true

/**
 * Each team's URL 
 */
function getTeamsUrl(team) {
    let baseUrl = BASE_URL;
    return `${baseUrl}/teams/${team}`
}

/**
 * Get all player urls in one team
 */
async function getPlayersUrlsFromEachTeam(team) {
    let playerUrls = [];
    let teamUrl = getTeamsUrl(team);

    //console.log(`Start to get player urls from ${teamUrl}`);

    let promise = new Promise(function (resolve, reject) {
        request(teamUrl, function(error, response, body) {
            if (error === null && response.statusCode === 200) {
                let tbody = cheerio.load(body)('tbody');
                let table = tbody[0];
                let entries = cheerio.load(table)('.entry-font');
                
                for (let entry of entries) {
                    let playerUrl = cheerio.load(entry)('a').attr("href");
                    playerUrls.push(playerUrl);
                }
    
                if (playerUrls.length > 0) {
                    resolve(playerUrls);
                } else {
                    reject("Failed to get player detail urls.");
                }
            } else {
                reject("Failed to get player detail urls.");
            }
        });
    });

    return promise;
}

/**
 * Get each player's attribute details
 */
async function getPlayerDetail(team, playerUrl) {
    let promise = new Promise(function (resolve, reject) {
        request(playerUrl, function(error, response, body) {
            if (error === null && response.statusCode === 200) {
                var p = new player();

                // name
                let nameDiv = cheerio.load(body)('h1');
                p.name = nameDiv.text().trim();

                // overall attribute
                let overallAttribute = cheerio.load(body)('.attribute-box-player');
                p.overallAttribute = parseInt(overallAttribute.text().trim());

                // team
                p.team = team;

                let attributes = cheerio.load(body)('.content .card .card-body .list-no-bullet li span');
                
                // outside scoring
                let closeShot = attributes[0].children[0].data.trim();
                p.closeShot = parseInt(closeShot);
                let midRangeShot = attributes[1].children[0].data.trim();
                p.midRangeShot = parseInt(midRangeShot);
                let threePointShot = attributes[2].children[0].data.trim();
                p.threePointShot = parseInt(threePointShot);
                let freeThrow = attributes[3].children[0].data.trim();
                p.freeThrow = parseInt(freeThrow);
                let shotIQ = attributes[4].children[0].data.trim();
                p.shotIQ = parseInt(shotIQ);
                let offensiveConsistency = attributes[5].children[0].data.trim();
                p.offensiveConsistency = parseInt(offensiveConsistency);

                // athleticism
                let speed = attributes[6].children[0].data.trim();
                p.speed = parseInt(speed);
                let acceleration = attributes[7].children[0].data.trim();
                p.acceleration = parseInt(acceleration);
                let strength = attributes[8].children[0].data.trim();
                p.strength = parseInt(strength);
                let vertical = attributes[9].children[0].data.trim();
                p.vertical = parseInt(vertical);
                let stamina = attributes[10].children[0].data.trim();
                p.stamina = parseInt(stamina);
                let hustle = attributes[11].children[0].data.trim();
                p.hustle = parseInt(hustle);
                let overallDurability = attributes[12].children[0].data.trim();
                p.overallDurability = parseInt(overallDurability);

                // inside scoring
                let layup = attributes[13].children[0].data.trim();
                p.layup = parseInt(layup);
                let standingDunk = attributes[14].children[0].data.trim();
                p.standingDunk = parseInt(standingDunk);
                let drivingDunk = attributes[15].children[0].data.trim();
                p.drivingDunk = parseInt(drivingDunk);
                let postHook = attributes[16].children[0].data.trim();
                p.postHook = parseInt(postHook);
                let postFade = attributes[17].children[0].data.trim();
                p.postFade = parseInt(postFade);
                let postControl = attributes[18].children[0].data.trim();
                p.postControl = parseInt(postControl);
                let drawFoul = attributes[19].children[0].data.trim();
                p.drawFoul = parseInt(drawFoul);
                let hands = attributes[20].children[0].data.trim();
                p.hands = parseInt(hands);

                // playmaking
                let passAccuracy = attributes[21].children[0].data.trim();
                p.passAccuracy = parseInt(passAccuracy);
                let ballHandle = attributes[22].children[0].data.trim();
                p.ballHandle = parseInt(ballHandle);
                let speedWithBall = attributes[23].children[0].data.trim();
                p.speedWithBall = parseInt(speedWithBall);
                let passIQ = attributes[24].children[0].data.trim();
                p.passIQ = parseInt(passIQ);
                let passVision = attributes[25].children[0].data.trim();
                p.passVision = parseInt(passVision);

                // defending
                let interiorDefense = attributes[26].children[0].data.trim();
                p.interiorDefense = parseInt(interiorDefense);
                let perimeterDefense = attributes[27].children[0].data.trim();
                p.perimeterDefense = parseInt(perimeterDefense);
                let steal = attributes[28].children[0].data.trim();
                p.steal = parseInt(steal);
                let block = attributes[29].children[0].data.trim();
                p.block = parseInt(block);
                let lateralQuickness = attributes[30].children[0].data.trim();
                p.lateralQuickness = parseInt(lateralQuickness);
                let helpDefenseIQ = attributes[31].children[0].data.trim();
                p.helpDefenseIQ = parseInt(helpDefenseIQ);
                let passPerception = attributes[32].children[0].data.trim();
                p.passPerception = parseInt(passPerception);
                let defensiveConsistency = attributes[33].children[0].data.trim();
                p.defensiveConsistency = parseInt(defensiveConsistency);

                // rebounding
                let offensiveRebound = attributes[34].children[0].data.trim();
                p.offensiveRebound = parseInt(offensiveRebound);
                let defensiveRebound = attributes[35].children[0].data.trim();
                p.defensiveRebound = parseInt(defensiveRebound);
    
                resolve(p);
            } else {
                reject("Failed to get player details");
            }
        });
    });

    return promise;
}

/**
 * Player sorting comparator
 */
function sortPlayers(a, b) {
    
    // Default option: group by each team, then sort all players by overall attributes from highest to lowest among the team
    if (a.team === b.team) {
        return b.overallAttribute - a.overallAttribute;
    }

    return a.team < b.team;

    // Another option is to sort all players by overall attributes from highest to lowest among the whole league
    // return b.overallAttribute - a.overallAttribute;
}

/**
 * Sava data to local disk. Every new run generates a new file.
 */
function saveData(db) {

    var filePath = './data/roster.json';
    if(historic)
    {
        filePath = './data/roster_historic.json';
    }
    var data = JSON.stringify(db, null, 4);
    
    fs.writeFile(filePath, data, function(error) {
        if (error == null) {
            console.log("Successfully saved the latest player rosters.");
        } else {
            console.log('Failed to save player roster to disk.', error);
        }
    })
}

var __main = async function() {
    let teams = CURRENT_TEAMS;

    if(historic) {
        teams = OLD_TEAM_NAMES;
    }

    // <teams, all player urls>
    var roster = new Map();

    // all players details
    var players = [];

    console.log("################ Start to get player urls ... ################");
    await Promise.all(teams.map(async team => {
        let playerUrls = await getPlayersUrlsFromEachTeam(team);
        roster.set(team, playerUrls);
    }));

    console.log("################ Start to get player details ... ################");
    for (let team of teams) {
        let playerUrls = roster.get(team);
        let prettiedTeamName = teamNamePrettier(team);

        console.log(`---------- ${prettiedTeamName} ----------`);
        
        await Promise.all(playerUrls.map(async playerUrl => {
            let player = await getPlayerDetail(prettiedTeamName, playerUrl);
            players.push(player);
            console.log(`Successfully get ${player.name}'s detail.`);
        }));
    }

    console.log("################ Sort players ... ################");
    players.sort(sortPlayers);

    console.log("################ Save to disk ... ################");
    saveData(players);
}

__main()
