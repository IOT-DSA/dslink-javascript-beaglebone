var b = require('bonescript'),
    Promise = Promise || require('es6-promises'),
    DS = require('dslink');

var link;

function wrapFunction(name) {
  var paramNames = Array.prototype.slice.apply(arguments).slice(1);
  return DS.createNode({
    onInvoke: function(params) {
      return new Promise(function(resolve, reject) {
        b[name].apply(b, paramNames.map(function(param) {
          if(param === "pin")
            return this.path.split("/")[2];
          return params[param];
        }.bind(this)).filter(function(param) {
          return typeof(param) !== 'undefined' && param !== null;
        }.push(function(x) {
          if(x.err) reject(x.err);
          resolve(x);
        }));
      }.bind(this));
    }
  });
}

var PinMode = wrapFunction("pinMode", "pin", "direction", "mux", "pullup", "slew");

var pinModeInvoke = PinMode.prototype.onInvoke;
PinMode.prototype.onInvoke = function(params) {
  params.direction = b[params.direction.toUpperCase()];
  pinModeInvoke.call(this, params);
};

var GetPinMode = wrapFunction("getPinMode", "pin");
var DigitalWrite = wrapFunction("digitalWrite", "pin", "value");
var DigitalRead = wrapFunction("digitalRead", "pin");

var ShiftOut = wrapFunction("shiftOut", "dataPin", "clockPin", "bitOrder", "val");

var shiftOutInvoke = ShiftOut.prototype.onInvoke;
ShiftOut.prototype.onInvoke = function(params) {
  params.bitOrder = b[params.bitOrder.toUpperCase()];
  shiftOutInvoke.call(this, params);
};

var AnalogWrite = wrapFunction("analogWrite", "value", "freq");
var AnalogRead = wrapFunction("analogRead", "pin");

var ENUM_BIT_ORDER = DS.buildEnumType(['msbfirst', 'lsbfirst']);
var ENUM_DIRECTION = DS.buildEnumType(['input', 'input_pullup', 'output']);
var ENUM_PULLUP = DS.buildEnumType(['pullup', 'pulldown', 'disabled']);
var ENUM_SLEW = DS.buildEnumType(['fast', 'slow']);

function addPin(name) {
  link.addNode('/pins/' + name, {
    pinMode: {
      $is: 'pinMode',
      $invokable: 'write',
      $params: [
        {
          name: 'direction',
          type: ENUM_DIRECTION
        },
        {
          name: 'mux',
          type: 'int'
        },
        {
          name: 'pullup',
          type: ENUM_PULLUP
        },
        {
          name: 'slew',
          type: ENUM_SLEW
        }
      ]
    },
    getPinMode: {
      $is: 'getPinMode',
      $invokable: 'write',
      $columns: [
        {
          name: 'mux',
          type: 'int'
        },
        {
          name: 'options',
          type: 'array'
        }
        {
          name: 'pullup',
          type: ENUM_PULLUP
        },
        {
          name: 'slew',
          type: ENUM_SLEW
        },
        {
          name: 'pin',
          type: 'string'
        },
        {
          name: 'name',
          type: 'string'
        }
      ]
    },
    digitalWrite: {
      $is: 'digitalWrite',
      $invokable: 'write',
      $params: [
        {
          name: 'value',
          type: 'uint'
        }
      ]
    },
    digitalRead: {
      $is: 'digitalRead',
      $invokable: 'write',
      $columns: [
        {
          name: 'value',
          type: 'uint'
        }
      ]
    },
    shiftOut: {
      $is: 'shiftOut',
      $invokable: 'write',
      $columns: [
        {
          name: 'dataPin',
          type: 'string'
        },
        {
          name: 'clockPin',
          type: 'string'
        },
        {
          name: 'bitOrder',
          type: ENUM_BIT_ORDER
        },
        {
          name: 'val',
          type: 'uint'
        }
      ]
    }
    /* TODO
    analogWrite: {
      $is: 'analogWrite',
      $invokable: 'write'
    },
    analogRead: {
      $is: 'analogRead',
      $invokable: 'write'
    }
    */
  });
}

var AddPin = DS.createNode({
  onInvoke: function(obj) {
    addPin(obj.name);
    return {};
  }
});

b.getPlatform(function(platform) {
  link = new DS.LinkProvider(process.argv.slice(2), 'beaglebone-', {
    defaultNodes: {
      pins: {},
      platform {
        name: {
          $type: 'string',
          '?value': platform.name
        },
        version: {
          $type: 'string',
          '?value': platform.version
        },
        serialNumber: {
          $type: 'string',
          '?value': platform.serialNumber
        },
        bonescriptVersion: {
          $type: 'string',
          '?value': platform.bonescript
        }
      },
      addPin: {
        $is: 'addPin',
        $invokable: 'write'
      },
    },
    profiles: {
      pinMode: function(path) {
        return new PinMode(path);
      }
      getPinMode: function(path) {
        return new GetPinMode(path);
      }
      digitalWrite: function(path) {
        return new DigitalWrite(path);
      }
      digitalRead: function(path) {
        return new DigitalRead(path);
      }
      shiftOut: function(path) {
        return new ShiftOut(path);
      }
      analogWrite: function(path) {
        return new AnalogWrite(path);
      }
      analogRead: function(path) {
        return new AnalogRead(path);
      },
      addPin: function(path) {
        return new AddPin(path);
      }
    }
  });

  // four on screen leds
  addPin('USR0');
  addPin('USR1');
  addPin('USR2');
  addPin('USR3');

  link.connect();
});
