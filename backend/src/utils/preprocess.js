function preprocessText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let processedText = text
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/@\w+/g, '')
    .replace(/#(\w+)/g, '$1')
    .replace(/RT\s+/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  return processedText;
}


function cleanForAnalysis(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/https?:\/\/[^\s]+/g, ' ')
    .replace(/@\w+/g, ' ')
    .replace(/RT\s+/gi, ' ')
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHashtags(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const hashtags = text.match(/#\w+/g) || [];
  return hashtags.map(tag => tag.slice(1).toLowerCase());
}

function extractMentions(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const mentions = text.match(/@\w+/g) || [];
  return mentions.map(mention => mention.slice(1).toLowerCase());
}

function extractUrls(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  return urls;
}

function cleanForAnalysis(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/https?:\/\/[^\s]+/g, ' ')
    .replace(/@\w+/g, ' ')
    .replace(/RT\s+/gi, ' ')
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  preprocessText,
  extractHashtags,
  extractMentions,
  extractUrls,
  cleanForAnalysis
};