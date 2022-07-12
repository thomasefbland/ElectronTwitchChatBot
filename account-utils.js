// !addaccount <name> [region]
// !removeaccount <name> [region]
// !setmain <name> [region]
// 
// !rank [name]
// !rankall
// !matchelo
// !matchrunes
// !opgg [name]

require('dotenv').config();
const Datastore = require('nedb-promises');

const regions = {
    NA: {
      route: "na1",
      display: "NA",
      continent: "AMERICAS"
    },
    EUW: {
      route: "euw1",
      display: "EUW",
      continent: "EUROPE"
    },
    EUNE: {
      route: "eun1",
      display: "EUNE",
      continent: "EUROPE"
    },
    BR: {
      route: "br1",
      display: "BR",
      continent: "AMERICAS"
    },
    JP: {
      route: "jp1",
      display: "JP",
      continent: "ASIA"
    },
    KR: {
      route: "kr",
      display: "KR",
      continent: "ASIA"
    },
    LAN: {
      route: "la1",
      display: "LAN",
      continent: "AMERICAS"
    },
    LAS: {
      route: "la2",
      display: "LAS",
      continent: "AMERICAS"
    },
    OCE: {
      route: "oc1",
      display: "OCE",
      continent: "AMERICAS"
    },
    RU: {
      route: "ru",
      display: "RU",
      continent: "EUROPE"
    },
    TR: {
      route: "tr1",
      display: "TR",
      continent: "EUROPE"
    },
}
async function getRegion(regionArg) {
  let region = undefined;

  if(regionArg == undefined) {
    region = regions.NA;
  } else {
    switch(regionArg.toLowerCase()) {
      case "na":
          region = regions.NA
          break;
      case "eu":
          region = regions.EUW
          break;
      case "euw":
          region = regions.EUW
          break;
      case "eune":
          region = regions.EUNE
          break;
      case "br":
          region = regions.BR
          break;
      case "jp":
          region = regions.JP
      case "kr":
          region = regions.KR
          break;
      case "lan":
          region = regions.LAN
      case "las":
          region = regions.LAS
          break;
      case "oce":
          region = regions.OCE
      case "ru":
          region = regions.RU
          break;
      case "tr":
          region = regions.TR
          break;
    }
  }
  return region;
}

const axios = require('axios');

async function getSummonerByName(name, region) {
  try {
    const response = await axios.get(`https://${region.route}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${process.env['riotApiKey']}`);
    return response;
  } catch (error) {
    return error.response;
  }
}

async function getLiveGame(account) {
  try {
    const response = await axios.get(`https://${account.region.route}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${account.id}?api_key=${process.env['riotApiKey']}`);
    return response;
  } catch (error) {
    return error.response;
  }
}

async function getLastMatchId(account) {
  try {
    const response = await axios.get(`https://${account.region.continent}.api.riotgames.com/lol/match/v5/matches/by-puuid/${account.puuid}/ids?start=0&count=1&api_key=${process.env['riotApiKey']}`);
    return response;
  } catch (error) {
    return error.response;
  }
}

async function getMatchData(account, matchId) {
  try {
    const response = await axios.get(`https://${account.region.continent}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${process.env['riotApiKey']}`);
    return response;
  } catch (error) {
    return error.response;
  }
}

async function getMostRecentAccount() {
  let datastore = Datastore.create('./accounts.db');
  const accounts = await datastore.find().then().catch();

  for (const account of accounts) {
    const liveMatch = await getLiveGame(account);
    if(liveMatch.status==200) { return account }
  }
  let mostRecentTimestamp = 0;
  let mostRecentGameAccount;
  for (const account of accounts) {
    const lastMatchId = await getLastMatchId(account);
    if(lastMatchId.data[0] == undefined) { continue }
    const lastMatchData = await getMatchData(account, lastMatchId.data[0]);
    if(lastMatchData.data.info.gameEndTimestamp > mostRecentTimestamp) {
      mostRecentTimestamp = lastMatchData.data.info.gameEndTimestamp;
      mostRecentGameAccount = account;
    }
  }

  return mostRecentGameAccount;
}

async function getAccountRankedData(account) {
  try {
    const response = await axios.get(`https://${account.region.route}.api.riotgames.com/lol/league/v4/entries/by-summoner/${account.id}?api_key=${process.env['riotApiKey']}`);
    return response;
  } catch (error) {
    return error.response;
  }
}

async function getAccountRank(account) {
  const accountRankedData = await getAccountRankedData(account);
  if(accountRankedData.data[0]==undefined) { return "is Unranked" } else {
    const str = `${accountRankedData.data[0].tier} ${accountRankedData.data[0].rank} ${accountRankedData.data[0].leaguePoints}LP`;
    return str;
  }
}


exports.getRegion = getRegion;
exports.getSummonerByName = getSummonerByName;
exports.getMostRecentAccount = getMostRecentAccount;
exports.getAccountRank = getAccountRank;

// (async () => {

//   let datastore = Datastore.create('./accounts.db');
//   const accounts = await datastore.find().then().catch();

//   for (const account of accounts) {
//     const liveMatch = await getLiveGame(account);
//       console.log(liveMatch.status);
//   }

// })();