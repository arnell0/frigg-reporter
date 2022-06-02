const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
var Twit = require('twit')

const client = new Twit({
    consumer_key: process.env.CONSUMER_TOKEN,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.CONSUMER_ACCESS_TOKEN,
    access_token_secret: process.env.CONSUMER_ACCESS_SECRET,
    timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
})


module.exports.Tweets = {
    Post: async (text) => {
        let { data, error } = await client.post('statuses/update', { status: text });
        return data.id_str
    },
    Reply: async (id, text) => {
        let { data, error } = await client.post('statuses/update', { status: text, in_reply_to_status_id: id });
        return data.id_str
    },
    /* 
        The ID of an existing status that the update is in reply to. 
        Note: This parameter will be ignored unless the author of the Tweet this parameter references is mentioned within the status text. 
        Therefore, you must include @username , where username is the author of the referenced Tweet, within the update
    */
}
