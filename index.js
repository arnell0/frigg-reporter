const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { FriggReporterTweets, FriggTweets, FriggQueries } = require('./api/supabase');
const { Tweets } = require('./api/twit');


async function parseTweets() {
    console.log("Detected new tweets in databse")
    console.log("Running")

    // await FriggTweets.Subscribe(parseTweets);
    console.log("Fetching tweets");
    const rawTweets = await FriggTweets.Read();
    
    console.log("Fetching queries");
    // fetch all queries
    const rawQueries = await FriggQueries.Read();

    console.log("Sorting queries")
    // sort rawTweets alphabetically after the first item in the query
    const queries = rawQueries.sort((a, b) => {	
        if (a.query[0].toLowerCase() < b.query[0].toLowerCase()) return -1;
        if (a.query[0].toLowerCase() > b.query[0].toLowerCase()) return 1;
        return 0;
    });


    console.log("Parsing tweets")
    // check if date is less or equal than n days old
    const checkDate = (now, days, inDate) => {
        const date = new Date(inDate);
        const diff = Math.abs(now - date);
        const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return diffDays <= days;
    }
    const now = new Date();
    const filteredTweetsWeek = rawTweets.filter(tweet => checkDate(now, 7, tweet.created_at.split('T')[0]));
    const filteredTweetsDay = rawTweets.filter(tweet => checkDate(now, 1, tweet.created_at.split('T')[0]));
    const compoundCalc = (arr) => {
        var sum = 0
        for (var i = 0; i < arr.length; i++) {
            sum += parseFloat(arr[i].compound)
        }
        return sum
    }

    const queriesUpdates = []

    console.log("Building new tweets")
    const newRows = queries.map((queryItem) => {

        const _queryItem = { ...queryItem }
        const {query, party, letter, compoundDay, compoundWeek} = _queryItem;

        // Filter out tweets that match the current query eg. ["Ebba Busch", "BuschEbba", "Kristdemokraterna"]
        const tweetsWeek = filteredTweetsWeek.filter(tweet => tweet.query[0].toLowerCase() == query[0].toLowerCase())
        const tweetsDay = filteredTweetsDay.filter(tweet => tweet.query[0].toLowerCase() == query[0].toLowerCase())

        // Calculate the compound of the tweets
        const compoundWeekValue = compoundCalc(tweetsWeek)
        const compoundDayValue = compoundCalc(tweetsDay)


        // Compares last compound value with current compound value [% change] 
        const compoundWeekDiff = ((compoundWeekValue / parseFloat(compoundWeek)) - 1) * 100
        const compoundDayDiff = ((compoundDayValue / parseFloat(compoundDay)) - 1 ) * 100

        // Update query with new compound values
        _queryItem.compoundWeek = compoundWeekDiff
        _queryItem.compoundDay = compoundDayDiff
        queriesUpdates.push(_queryItem)

        // Format text to be included in tweet sent to twitter
        /*  eg.
            Magdalena Andersson 
            Socialdemokraterna (S)
            F??r??ndring 1 dag: +-0.00
            F??r??ndring 7 dagar: +-0.00
        */
        const text = `${query[0]}\n${party} (${letter})\nF??r??ndring 1 dag: ${compoundDayDiff.toFixed(2)}%\nF??r??ndring 7 dagar: ${compoundWeekDiff.toFixed(2)}%\n@arnell00`

        return {
            name: query[0],
            party,
            letter,
            query,  
            tweetsWeek,
            tweetsDay,
            compoundWeek: compoundWeekValue,
            compoundDay: compoundDayValue,
            compoundWeekDiff,
            compoundDayDiff,
            text
        }
    })

    console.log("Storing new tweets")
    // Store new rows in database
    await FriggReporterTweets.Create(newRows);

    console.log("Updating queries")
    // Update queries with new compound values
    await FriggQueries.Upsert(queriesUpdates);

    // Build whole tweet
    const texts = newRows.map(({text}) => text);

    const first = `Senaste statistiken ??ver vad svenska v??ljare tycker om dessa partiledare.\n${rawTweets.length}st tweets har anv??nts f??r att generera denna rapport.\n\nL??s tr??den och kommentera g??rna vad ni tycker!`
    const second = `Jag ??r Frigg, ett automatiserat program som ??vervakar opinionen om partiledarna h??r p?? Twitter.\nF??r fr??gor eller f??rslag, kontakta mig g??rna p?? friggai@protonmail.me eller via Twitter.\nJag skapades av @arnell00.`
    const last = 'Min k??llkod ??r open-source och hittas i slutet av dessa l??nkar.\nTwitterbot: https://github.com/arnell0/frigg-reporter\nDatainsamling: https://github.com/arnell0/frigg-pipeline \n@arnell00'
    
    /* console.log("Posting base tweet")
    const baseTweet = await Tweets.Post(first)

    console.log("Posting second tweet")
    await Tweets.Reply(baseTweet, second)

    for (let i = 0; i < texts.length; i++) {
        setTimeout(async () => {
            console.log(`Posting tweet ${i}/${texts.length - 1}`)
            await Tweets.Reply(baseTweet, texts[i])
        }, 5000)
    }

    console.log(`Posting last tweet in ${texts.length} seconds`)
    setTimeout(async () => {
        console.log("Posting last tweet")
        await Tweets.Reply(baseTweet, last)
    }, ((texts.length - 1) * 1200)) */

    console.log("Done!")
}

async function main() {
    console.log("Started")
    const subscribe = await FriggTweets.Subscribe(parseTweets);
}

main()


