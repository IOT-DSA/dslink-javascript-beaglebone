var b = require('bonescript'),
DS = require('dslink');

function addNode(link, count) {
  var name = 'USR' + count,
      node = link.loadNode({
        'name': name,
        'value': new DS.Value(false),
        'actions': [
          {
            'name': 'Toggle',
            'callback': function() {
              node.value = node.value.value === false ? new DS.Value(true) : new DS.Value(false);
              b.digitalWrite(name, node.value.value === false ? b.LOW : b.HIGH);
            }
          }
        ]
      });

  console.log(node.getPath());

  b.pinMode(name, b.OUTPUT);
  b.digitalWrite(name, b.LOW);
}

(function(undefined) {
  var link = new DS.Link("BeagleboneLink");
  link.connect("rnd.iot-dsa.org", function(err) {
    if (err) throw err;

    var count = 4;
    while (--count >= 0) {
      addNode(link, count);
    }
  });
})();
