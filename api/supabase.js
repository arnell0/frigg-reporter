const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('@supabase/supabase-js');
const {SUPABASE_API_URL, SUPABASE_API_KEY} = process.env;

const SupabaseClient = supabase.createClient(SUPABASE_API_URL, SUPABASE_API_KEY);

module.exports.FriggTweets = {
    Read: async () => {
        let { data, error } = await SupabaseClient.from('frigg-tweets').select('*');
        if (error) console.log(error);
        return data;
    },
    Subscribe: async (callback) => {
        var run = true
        const subscription = SupabaseClient.from('frigg-tweets').on('INSERT', payload => {
            if (run) {
                setTimeout(() => {
                    callback()
                    run = true
                }, 120000)
            }
            run = false
        }).subscribe(() => console.log('Listening after tweets...'));
    }
}
module.exports.FriggQueries = {
    Read: async () => {
        let { data, error } = await SupabaseClient.from('frigg-queries').select('*');
        if (error) console.log(error);
        return data;
    },
    Upsert: async items => {
        const { data, error } = await SupabaseClient
        .from('frigg-queries')
        .upsert(items)
        if(error) console.log(error)
      },
}
module.exports.FriggReporterTweets = {
    Create: async (newRows) => {
        let { data, error } = await SupabaseClient.from('frigg-reporter-tweets').insert(newRows);
        if (error) console.log(error);
        return data;
    },
    Read: async () => {
        let { data, error } = await SupabaseClient.from('frigg-reporter-tweets').select('*');
        if (error) console.log(error);
        return data;
    },
}






