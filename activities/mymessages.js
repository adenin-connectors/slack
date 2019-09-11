'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    const userConversations = await api('/users.conversations');
    if ($.isErrorResponse(activity, userConversations)) return;

    let channelId = getGeneralChannelId(userConversations);

    var dateRange = $.dateRange(activity);
    let start = new Date(dateRange.startDate).valueOf().toString();
    let end = new Date(dateRange.endDate).valueOf().toString();
    //this is the format of the time that slack uses, without '.' and extra numbers it falls back to defaults
    let oldest = start.substring(0, start.length - 3) + "." + start.substring(start.length - 3) + '000';
    let latest = end.substring(0, end.length - 3) + "." + end.substring(end.length - 3) + '000';

    let pagination = $.pagination(activity);
    if (pagination.nextpage) {
      latest = pagination.nextpage;
    }

    const response = await api(`/channels.history?channel=${channelId}` +
      `&oldest=${oldest}&latest=${latest}&count=${pagination.pageSize}`);

    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data = api.convertMessagesToItems(response.body.messages);
    if (response.body.has_more == true) {
      activity.Response.Data._nextpage = response.body.messages[pagination.pageSize - 1].ts;
    }
  } catch (error) {
    $.handleError(activity, error);
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