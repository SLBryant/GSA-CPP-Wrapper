var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');

var app = express();

var cpp = [];

app.use('/', express.static(__dirname + '/html'));

console.log('hello world')

app.get('/search', function(req, res) {
	cpp = [];
    console.log('/search')
    var cppQuery = {
        'originAPCode': req.query.originAPCode,
        'originCity': req.query.originCity,
        'destAPCode': req.query.destAPCode,
        'destCity': req.query.destCity,
        'fiscalYear': "Search+FY+15"
    };
    request.post({
        url: 'http://cpsearch.fas.gsa.gov/cpsearch/mainList.do',
        form: cppQuery,
    }, function(error, response, html) {
        if (!error && response.statusCode == 200) {
            console.log('post success')
            var $ = cheerio.load(html);
            var rootURL = 'http://cpsearch.fas.gsa.gov/cpsearch/';
            $('.displaytable tbody tr').each(function() {
                console.log('tr each')
                var infoURLS = {};
                infoURLS.awardDetails = rootURL + $(this).find('td:first-child a').attr('href');
                infoURLS.itemID = infoURLS.awardDetails.split('=');
                infoURLS.itemID = parseFloat(infoURLS.itemID[infoURLS.itemID.length - 1]);
                infoURLS.VCA = rootURL + $(this).find('td:nth-child(5) a').attr('href');
                infoURLS.CA = rootURL + $(this).find('td:nth-child(6) a').attr('href');
                if ($(this).find('td:nth-child(7) a').attr('href')) {
                    infoURLS.CB = rootURL + $(this).find('td:nth-child(7) a').attr('href');
                }
                var cppEntry = {
                    'info_urls': infoURLS,
                    '_id': infoURLS.itemID
                }
                cpp.push(cppEntry);
            });
            //res.json(cpp)

            getAwardDetails(0,res);
            //collects data from one of the infoURLS
        }
    });
});

function getAwardDetails(i,res) {

    if (i < cpp.length) {
        request(cpp[i]['info_urls']['awardDetails'], function(error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                console.log('success')
                $('.fareTable tr:not(:first-child)').each(function() {
                    var label = $(this).find('td:first-child').text().replace(/\r?\n|\r|\t|/g, '').replace(/\'/g, '').replace(/:/g, '').replace(/[ \t]+$/, '').replace(/ /g, '_').toLowerCase();
                    var value = $(this).find('td:last-child').text().replace(/\r?\n|\r|\t/g, '').replace(/\'/g, '').replace(/\$|\.00/g, '').replace(/[ \t]+$/, '');
                    if (value === '0') value = null;
                    cpp[i][label] = value;
                });
                /*console.log(_.findWhere(cpp, {
                        item_id: infoURLS[i]['item_id']
                    }))*/
                //cppResponses[i]['award_details'] = awardDetails
                //getAwardDetails(i + 1)
            }
            console.log('thru')
            getAwardDetails(i + 1,res)
            
        })
    } else {
        //GET YCA
        //GET CA
        //IF CB GET CB
        //REMOVE INFO_URLS:
        for (i in cpp) {
            delete cpp[i]['info_urls'];
        }
        //AND FINALLY:
        console.log('finished')
        res.json(cpp)
    }
}

// 

app.listen(process.env.PORT || 3000);
