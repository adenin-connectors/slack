'use strict';

const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    const userConversations = await api('/users.conversations');

    if (!cfActivity.isResponseOk(activity, userConversations)) {
      return;
    }

    let channelId = getGeneralChannelId(userConversations);
    const response = await api(`/channels.history?channel=${channelId}`);

    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }

    var dateRange = cfActivity.dateRange(activity, "today");
    //passess messages into filter function to filter by date, then converts messages to items
    activity.Response.Data = api.convertMessagesToItems(filterMessagesByDateRange(response, dateRange));
  } catch (error) {
    cfActivity.handleError(activity, error);
  }
};
//** searches for 'general' channel and retrieves its id */
function getGeneralChannelId(data) {
  let channels = data.body.channels;
  for (let i = 0; i < channels.length; i++) {
    if (channels[i].name == "general") {
      return channels[i].id;
    }
  }
}
//** filters messages based on privided daterange */
function filterMessagesByDateRange(response, daterange) {
  let filtered = [];
  let messages = response.body.messages;
  let start = new Date(daterange.startDate).valueOf();
  let end = new Date(daterange.endDate).valueOf();

  for (let i = 0; i < messages.length; i++) {
    //converts time to proper miliseconds
    let milis = messages[i].ts.split('.')[0] + '000';
    if (milis > start && milis < end) {
      filtered.push(messages[0]);
    }
  }

  return filtered;
}