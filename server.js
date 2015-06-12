var express = require('express');
var app = express();
var request = require('request');
var cheerio = require('cheerio');


app.use('/', express.static(__dirname + '/html'));


app.get('/search', function(req, res) {
    var cppQuery = {
        'originAPCode': req.query.originAPCode,
        'originCity': req.query.originCity,
        'destAPCode': req.query.destAPCode,
        'destCity': req.query.destCity,
        'fiscalYear': "Search+FY+15"
    };
    console.log('cppQuery', cppQuery)
    request.post({
        url: 'http://cpsearch.fas.gsa.gov/cpsearch/mainList.do',
        form: cppQuery,
    }, function(error, response, html) {
        if (!error && response.statusCode == 200) {
            console.log('success')
            var $ = cheerio.load(html);
            var infoURLS = [];
            var rootURL = 'http://cpsearch.fas.gsa.gov/cpsearch/'
            $('.displaytable tbody td:first-child').each(function() {
                var infoURL = rootURL + $(this).find('a').attr('href')
                infoURLS.push(infoURL)
            })
            console.log(infoURLS)
            var cppResponses = [];
            getRateInfo(0);
            function getRateInfo(i) {
            		console.log(infoURLS[i])
                    if (i < infoURLS.length) {
                        request(infoURLS[i], function(error, response, html) {
                            if (!error && response.statusCode == 200) {
                                var $ = cheerio.load(html);
                                var cppResponse = {};
                                $('.fareTable tr:not(:first-child)').each(function() {
                                    var label = $(this).find('td:first-child').text().replace(/\r?\n|\r|\t|/g,'').replace(/\'/g,'').replace(/:|"/g,'').replace(/[ \t]+$/,'')
                                    var value = $(this).find('td:last-child').text().replace(/\r?\n|\r|\t/g,'').replace(/\'/g,'').replace(/:|"/g,'').replace(/[ \t]+$/,'')
                                    cppResponse[label] = value;
                                });
                                cppResponses.push(cppResponse);
                                getRateInfo(i + 1)
                            }
                        })
                    } else {
                    	console.log('read to respond')
                    	console.log(cppResponses)
                        res.json(cppResponses)
                    }
                }
                //var resultsItem = {

            //}
            //results.push(resultsItem);
            //console.log(results)
            //res.json(results)
            
        } else {
            res.status(500).send(error + response.statusCode);
        }
    });
});

app.listen(process.env.PORT || 3000);
