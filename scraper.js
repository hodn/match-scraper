exports.handler = async function (event, context) {

    const axios = require('axios');
    const cheerio = require('cheerio');
    const cheerioTableparser = require('cheerio-tableparser');

    const path = require('path');
    const icalGenerator = require(path.resolve(__dirname, "./icalGenerator.js"));

    const url = event.queryStringParameters.teamUrl;
    
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
            cheerioTableparser($)

            // Getting match table and parsing into table
            let parsedData = $("table.component__table.has-wrapper.games-new-table").parsetable();

            let dates = parsedData[0].slice(1);
            let times = parsedData[1].slice(1);
            let pitches = parsedData[2].slice(1);
            let teams = parsedData[3].slice(1);
            let rounds = parsedData[4].slice(1);
            let teamNames = [];
            let teamColors = [];
            let pitchLinks = [];
            let matches = [];


            // Parsing team match pairs and their shirts
            teams.forEach(team => {
                const $ = cheerio.load(team);
                let names = $('a');
                let colors = $('a.component__table-shirt.dress-color-action').toArray();

                $(colors).each(function (index, value) {
                    teamColors.push($(this).attr('title'))
                });

                $(names).each(function (index, value) {
                    teamNames.push($(this).text())
                });

            });

            // Parsing pitches and creating links to them
            pitches.forEach(pitch => {
                const $ = cheerio.load(pitch);
                const pitchLink = $('a').attr('href')
                pitchLinks.push('https://www.psmf.cz' + pitchLink);

            });

            // Clearing out empty values
            teamNames = teamNames.filter(n => n);

            // Connecting the data together
            for (let index = 0; index < dates.length; index++) {

                let match = {
                    homeTeam: teamNames[index * 2],
                    homeColors: teamColors[index * 2],
                    awayTeam: teamNames[index * 2 + 1],
                    awayColors: teamColors[index * 2 + 1],
                    date: dates[index].split(';')[1],
                    time: times[index],
                    round: rounds[index],
                    pitch: pitchLinks[index]
                }

                matches.push(match);
            }

            const ics = icalGenerator(url, matches);

            return {
                statusCode: 200,
                body: ics.toString()
            };
        
    } catch (e) {
        console.log(e)
        return {
            statusCode: 400,
            body: JSON.stringify(e)
        }
    }
    

}
