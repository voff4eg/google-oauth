

exports.OAuth 	= OAuth;
exports.OAuth2 	= OAuth2;

var util   = require('util');
var oauth  = require('oauth');
var querystring = require('querystring');

var getRequestTokenUrl = 'https://www.google.com/accounts/OAuthGetRequestToken';
var getAccessTokenUrl	 = 'https://www.google.com/accounts/OAuthGetAccessToken';
var authorizeTokenUrl  = 'https://www.google.com/accounts/OAuthAuthorizeToken';

//Use memory cache to store [randomkey -> oauth_token_secret]
var cache = require('node-cache');
var CACHE_TIMEOUT = 600000; // 10 MINUTE

//Random-key Generator  https://github.com/substack/node-hat
var hat = require('hat');
var rack = hat.rack();

util.inherits(OAuth, oauth.OAuth);

function OAuth(consumer_key, consumer_secret, callback_url){
	
	oauth.OAuth.call(this, getRequestTokenUrl, getAccessTokenUrl, consumer_key, consumer_secret, '1.0', callback_url, "HMAC-SHA1");
}

OAuth.prototype.getGoogleAuthorizeTokenURL = function(scopes, callback) {
	
	if(typeof scopes != 'object' || !scopes.join) throw 'Invalid Argument (scopes)';
	
	callback = callback || function(){}
	
	var randomkey = rack()+'';
	var saveCalledback = this._authorize_callback;
	this._authorize_callback = this._authorize_callback + '?randomkey='+randomkey;
	
	this.getOAuthRequestToken({ scope: scopes.join(' ') },function(err, oauth_Token, oauth_token_secret, oauth_callback_confirmed){

		if (err) return callback(err,null);
    
		var reditectUrl = authorizeTokenUrl + '?oauth_token='+ oauth_Token;
		
		cache.put(randomkey, oauth_token_secret, CACHE_TIMEOUT) // Time in ms
		return callback(null, reditectUrl, oauth_token_secret);
  });

	this._authorize_callback = saveCalledback;
}

OAuth.prototype.getGoogleAccessToken = function(params, callback) {
	
	callback = callback || function(){}
	
	var randomkey 				 = params.randomkey;
	var oauth_token_secret = cache.get(randomkey);
	var oauth_token 			 = params.oauth_token;
	var oauth_verifier 		 = params.oauth_verifier;
	
	this.getOAuthAccessToken( oauth_token, oauth_token_secret, oauth_verifier, 
		function (err, oauth_token, oauth_token_secret) {
		
		if (err) return callback(err,null);
		return callback(null, oauth_token, oauth_token_secret);
	});
}


util.inherits(OAuth2, oauth.OAuth2);

function OAuth2(consumer_key, consumer_secret, callback_url){
	oauth.OAuth2.call(this,arguments);
}

