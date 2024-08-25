module.exports = function icalGenerator(url, events) {

    const ical = require('ical-generator');

    const calendar = ical({ name: 'PSMF zapasy' });
    calendar.timezone('Europe/Prague');

    for (let index = 0; index < events.length; index++) {
        let selected = events[index];

        let date = selected.date.split('.');
        let time = selected.time.split(':');
        const startTime = new Date('20' + date[2], date[1] - 1, date[0], time[0], time[1]);
        const endTime = new Date();
        endTime.setTime(startTime.getTime() + 65 * 60 * 1000);

        
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
