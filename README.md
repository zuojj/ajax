# ajax
A ajax library from jQuery/Zepto

## Defaults Config
```
Ajax.settings = {
    type: 'GET',

    context: null,

    xhr: function() {
        return new window.XMLHttpRequest();
    },

    accepts: {
        script: 'text/javascript, application/javascript',
        json: jsonType,
        xml: 'application/xml, text/xml',
        html: htmlType,
        text: 'text/plain'
    },

    crossDomain: false,

    timeout: 0,

    beforeSend: noop,

    success: noop,

    error: noop,

    complete: noop
}
```

## JSON Type
```
Ajax({
    url: 'test.html',
    dataType: 'json',
    data: {
        name: 'benjamin',
        sex: 'male'
    },

    success: function(data) {

    },

    error: function() {
        
    }
})
```


## JSONP
```
Ajax({
    url: 'test.html',
    dataType: 'jsonp',
    data: {
        name: 'benjamin',
        sex: 'male'
    },

    success: function(data) {

    },

    error: function() {
        
    }
})
```