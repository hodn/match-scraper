module.exports = function icalGenerator(url, events) {

    const ical = require('ical-generator');

    const calendar = ical({ name: 'PSMF zapasy' });
    calendar.timezone('Europe/Prague');

    function hasMissingEventData(obj) {
        return Object.values(obj).some(value => value === undefined);
      }

    for (let index = 0; index < events.length; index++) {
        let selected = events[index];

        // If the line has missing data (time, date, round, team names, etc.) then don't add it to the .ics file
        if (hasMissingEventData(selected)) {
            continue;
        }

        let date = selected.date.split('.');
        let time = selected.time.split(':');
        const startTime = new Date('20' + date[2], date[1] - 1, date[0], time[0], time[1]);
        const endTime = new Date();
        endTime.setTime(startTime.getTime() + 65 * 60 * 1000); // 30 + 30 minutes game, 5 minute break

        
        calendar.createEvent({
            start: startTime,
            end: endTime,
            summary: selected.isRefType ? `Pískání: ${selected.homeTeam} - ${selected.awayTeam}` : `${selected.homeTeam} - ${selected.awayTeam}`,
            description: {
                plain: `${selected.homeTeam}: ${selected.homeColors} \n${selected.awayTeam}: ${selected.awayColors} \n${selected.round} kolo \nHřiště: ${selected.pitch} \nRozpis: ${url}`,
                html: `${selected.homeTeam}: ${selected.homeColors} <br/> ${selected.awayTeam}: ${selected.awayColors} <br/> ${selected.round} kolo <br/> Hřiště: ${selected.pitch} <br/> Rozpis: $url`
            },
            location: selected.pitch,
            url: url
        });

    }

    return calendar;

}
