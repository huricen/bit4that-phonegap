document.addEventListener('deviceready', GetMap, false);

var map = null;
var searchManager = null;
var currInfobox = null;
var infoboxLayer = new Microsoft.Maps.EntityCollection();
var pinLayer = new Microsoft.Maps.EntityCollection();
var currentPins = null;

function GetMap() {
    navigator.geolocation.getCurrentPosition(
        geolocationSuccess,
        geolocationError);
}

function geolocationError(error) {
    alert("Something bad happened");
}

function geolocationSuccess(position) {    

//alert('Latitude: ' + position.coords.latitude + '\n' +
//    'Longitude: ' + position.coords.longitude + '\n' +
//    'Altitude: ' + position.coords.altitude + '\n' +
//    'Accuracy: ' + position.coords.accuracy + '\n' +
//    'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
//    'Heading: ' + position.coords.heading + '\n' +
//    'Speed: ' + position.coords.speed + '\n' +
//    'Timestamp: ' + position.timestamp + '\n');

    Microsoft.Maps.loadModule('Microsoft.Maps.Themes.BingTheme', {
        callback: function () {
            var location = new Microsoft.Maps.Location(position.coords.latitude, position.coords.longitude);
            map = new Microsoft.Maps.Map(document.getElementById('divMap'),
            {
                credentials: "Ap8omsRmJLyjT6XhjSDsARZcezqlCHHJu8-fcm8ofynSakB6CaXJ6c4W2za4VqPV",
                mapTypeId: Microsoft.Maps.MapTypeId.road,
                enableClickableLogo: false,
                enableSearchLogo: false,
                center: location,
                zoom: 15,
                theme: new Microsoft.Maps.Themes.BingTheme()
            });

            map.entities.push(pinLayer);
            map.entities.push(infoboxLayer);

            pinInfobox = new Microsoft.Maps.Infobox(location, { visible: false });
            infoboxLayer.push(pinInfobox);

            // Retrieve the location of the map center 
            var center = map.getCenter();

            Microsoft.Maps.Pushpin.prototype.MerchantId = null;

            // Add a pin to the center of the map, using a custom icon
            var pin = new Microsoft.Maps.Pushpin(center, {
               // icon: 'img/pushpin.png',
                width: 50, height: 50, draggable: false
            });

            map.entities.push(pin);

            getAllMerchants();
        }
    });
}

function clearPins() {
    if (currentPins == null || currentPins.length == 0) return;
    for (var index = 0; index < currentPins.length; index++)
        pinLayer.remove(currentPins[index]);
}

function getAllMerchants() {
    currentPins = new Array();
    var client = new WindowsAzure.MobileServiceClient('https://bit4that.azure-mobile.net/', 'GuhAbetsMVctdbTAjDGBITiAjqBMEr93');
    var merchantDirectoryTable = client.getTable('MerchantDirectory');
    merchantDirectoryTable.read().then(
        function (list) {
            var directoryListing = jQuery.parseJSON(JSON.stringify(list));
            for (var index = 0; index < directoryListing.length; index++) {
                var directory = directoryListing[index];
                var location = new Microsoft.Maps.Location(directory.latitude, directory.longitude);
                var pin = new Microsoft.Maps.Pushpin(
                    location,
                    {
                        icon: 'img/bitcoin.png',
                        width: 50,
                        height: 50,
                        draggable: false
                    }
                );
                pin.MerchantId = directory.id;
                pin.Title = directory.name;
                pin.Description = directory.description + '\n' + directory.website;
                Microsoft.Maps.Events.addHandler(pin, 'click', showInfoBox);
                pinLayer.push(pin);
                currentPins.push(pin);
            }
        }
        );
}

function getMerchants() {
    var hashtagValue = document.getElementById('txtSearch').value;
    var client = new WindowsAzure.MobileServiceClient('https://bit4that.azure-mobile.net/', 'GuhAbetsMVctdbTAjDGBITiAjqBMEr93');
    var hashTagDirectoryTable = client.getTable('HashTagDirectory');
    hashTagDirectoryTable.
        where({ hashtag: hashtagValue }).read().then(
        (function (results) {
            var ds = jQuery.parseJSON(JSON.stringify(results));
            if (ds.length == 0) {
                alert("No results");
                return;
            }
            clearPins();
            currentPins = new Array();
            for (var index = 0; index < ds.length; index++) {
                var merId = ds[index].merchantid;
                var merchantDirectoryTable = client.getTable('MerchantDirectory');
                merchantDirectoryTable.where({ id: merId }).read().then(
                    function (list) {
                        var directoryListing = jQuery.parseJSON(JSON.stringify(list));
                        var directory = directoryListing[0];
                        var location = new Microsoft.Maps.Location(directory.latitude, directory.longitude);
                        var pin = new Microsoft.Maps.Pushpin(
                            location,
                            {
                                icon: 'img/bitcoin.png',
                                width: 50, height: 50, draggable: false
                            }
                        );
                        pin.MerchantId = directory.id;
                        pin.Title = directory.name;
                        pin.Description = directory.description + '\n' + directory.website;
                        Microsoft.Maps.Events.addHandler(pin, 'click', showInfoBox);
                        pinLayer.push(pin);
                        currentPins.add(pin);
                    }
                    );
            }
        }));
}

var merchantId;
var merchantName;
function showInfoBox(e) {
    if (e.targetType != 'pushpin') return;
    merchantId = e.target.MerchantId;
    merchantName = e.target.Title;
    pinInfobox.setOptions({
        title: e.target.Title,
        description: e.target.Description,
        visible: true,
        offset: new Microsoft.Maps.Point(0, 25),
        titleClickHandler: showServices
    });
    pinInfobox.setLocation(e.target.getLocation());
}

function hideServices(e) {
    $('#wrapper').show();
    $('#merchantServices').hide();
}

function showServices(e) {
    hideInfobox();
    $('#wrapper').hide();
    $('#merchantServices').show();
    $('#merchantName').html(merchantName);
    //$('.add-button').button({ icons: { primary: "ui-add-button" }, text: false });

    window.BitCredits = window.BitCredits || [];
    window.BitCredits.push([
        "launchPayment",
        {
            node: ".bitc-zone",
            amount: 5,
            onPaymentReady: function() {
                alert("Sending");
            }
        }
    ]);

    $('#merchant-services-items').empty();
    var client = new WindowsAzure.MobileServiceClient('https://bit4that.azure-mobile.net/', 'GuhAbetsMVctdbTAjDGBITiAjqBMEr93');
    var merchantServiceTable = client.getTable('MerchantServices');
    merchantServiceTable.where({ merchantid: merchantId }).read().then(
        function(list) {
            var serviceListing = jQuery.parseJSON(JSON.stringify(list));
            
            for (var index = 0; index < serviceListing.length; index++) {
                var current = serviceListing[index];
                $('#merchant-services-items').append(
                    "<tr><td width='22'><img src='" + current.pictureurl + "' height='20' width='20' /></td><td>" + current.name + "</td><td>$"+ current.listprice + "</td></tr><tr><td colspan='2'>handcut french fries, gravy, cheddar, herbs</td><td><button class='add-button'>&nbsp;add&nbsp;</button><button class='remove-button'>remove</button></td></tr>"
                );

            }
        }
    );

//  $('merchant-services-items').html("Menu");
}

function hideInfobox(e) {
    pinInfobox.setOptions({ visible: false });
}

function createSearchManager() {
    map.addComponent('searchManager', new Microsoft.Maps.Search.SearchManager(map));
    searchManager = map.getComponent('searchManager');
}

function LoadSearchModule() {
    Microsoft.Maps.loadModule('Microsoft.Maps.Search', { callback: searchRequest });
}

function searchRequest() {
    getMerchants();
    /*
    createSearchManager();
    var query = document.getElementById('txtSearch').value;
    var request =
        {
            query: query,
            count: 20,
            startIndex: 0,
            bounds: map.getBounds(),
            callback: search_onSearchSuccess,
            errorCallback: search_onSearchFailure
        };
    searchManager.search(request);
    */
}

function search_onSearchSuccess(result, userData) {
    map.entities.clear();
    var searchResults = result && result.searchResults;
    if (searchResults) {
        for (var i = 0; i < searchResults.length; i++) {
            search_createMapPin(searchResults[i]);
        }
        if (result.searchRegion && result.searchRegion.mapBounds) {
            map.setView({ bounds: result.searchRegion.mapBounds.locationRect });
        }
        else {
            alert('No results');
        }
    }
}

function search_createMapPin(result) {
    if (result) {
        var pin = new Microsoft.Maps.Pushpin(result.location, null);
        Microsoft.Maps.Events.addHandler(pin, 'click', function () {
            search_showInfoBox(result)
        });
        map.entities.push(pin);
    }
}

function search_showInfoBox(result) {
    if (currInfobox) {
        currInfobox.setOptions({ visible: true });
        map.entities.remove(currInfobox);
    }
    currInfobox = new Microsoft.Maps.Infobox(
        result.location,
        {
            title: result.name,
            description: [result.address, result.city, result.state,
              result.country, result.phone].join(' '),
            showPointer: true,
            titleAction: null,
            titleClickHandler: null
        });
    currInfobox.setOptions({ visible: true });
    map.entities.push(currInfobox);
}

function search_onSearchFailure(result, userData) {
    alert('Search  failed');
}