/*globals define, module, Symbol, Map, Set */
/*jshint -W056 */

(function (globals) {
  'use strict';

  var messages, predicates, functions, assert, not, maybe, collections,
     hasOwnProperty, toString, keys, slice, isArray, neginf, posinf,
     haveSymbols, haveMaps, haveSets;

  messages = {};
  predicates = {};

  [
    { n: 'equal', f: equal, s: 'equal {e}' },
    { n: 'undefined', f: isUndefined, s: 'be undefined' },
    { n: 'null', f: isNull, s: 'be null' },
    { n: 'assigned', f: assigned, s: 'be assigned' },
    { n: 'primitive', f: primitive, s: 'be primitive type' },
    { n: 'contains', f: contains, s: 'contain {e}' },
    { n: 'in', f: isIn, s: 'be in {e}' },
    { n: 'containsKey', f: containsKey, s: 'contain key {e}' },
    { n: 'keyIn', f: keyIn, s: 'be key in {e}' },
    { n: 'zero', f: zero, s: 'be 0' },
    { n: 'one', f: one, s: 'be 1' },
    { n: 'infinity', f: infinity, s: 'be infinity' },
    { n: 'number', f: number, s: 'be Number' },
    { n: 'integer', f: integer, s: 'be integer' },
    { n: 'float', f: float, s: 'be non-integer number' },
    { n: 'even', f: even, s: 'be even number' },
    { n: 'odd', f: odd, s: 'be odd number' },
    { n: 'greater', f: greater, s: 'be greater than {e}' },
    { n: 'less', f: less, s: 'be less than {e}' },
    { n: 'between', f: between, s: 'be between {e} and {e2}' },
    { n: 'greaterOrEqual', f: greaterOrEqual, s: 'be greater than or equal to {e}' },
    { n: 'lessOrEqual', f: lessOrEqual, s: 'be less than or equal to {e}' },
    { n: 'inRange', f: inRange, s: 'be in the range {e} to {e2}' },
    { n: 'positive', f: positive, s: 'be positive number' },
    { n: 'negative', f: negative, s: 'be negative number' },
    { n: 'string', f: string, s: 'be String' },
    { n: 'emptyString', f: emptyString, s: 'be empty string' },
    { n: 'nonEmptyString', f: nonEmptyString, s: 'be non-empty string' },
    { n: 'match', f: match, s: 'match {e}' },
    { n: 'boolean', f: boolean, s: 'be Boolean' },
    { n: 'object', f: object, s: 'be Object' },
    { n: 'emptyObject', f: emptyObject, s: 'be empty object' },
    { n: 'nonEmptyObject', f: nonEmptyObject, s: 'be non-empty object' },
    { n: 'instanceStrict', f: instanceStrict, s: 'be instanceof {t}' },
    { n: 'thenable', f: thenable, s: 'be promise-like' },
    { n: 'instance', f: instance, s: 'be {t}' },
    { n: 'like', f: like, s: 'be like {e}' },
    { n: 'array', f: array, s: 'be Array' },
    { n: 'emptyArray', f: emptyArray, s: 'be empty array' },
    { n: 'nonEmptyArray', f: nonEmptyArray, s: 'be non-empty array' },
    { n: 'arrayLike', f: arrayLike, s: 'be array-like' },
    { n: 'iterable', f: iterable, s: 'be iterable' },
    { n: 'date', f: date, s: 'be valid Date' },
    { n: 'function', f: isFunction, s: 'be Function' },
    { n: 'hasLength', f: hasLength, s: 'have length {e}' },
    { n: 'throws', f: throws, s: 'throw' }
  ].map((data) => {
    var n = data.n;
    messages[n] = 'assert failed: expected {a} to ' + data.s;
    predicates[n] = data.f;
  });

  functions = {
    map: map,
    all: all,
    any: any
  };

  collections = [ 'array', 'arrayLike', 'iterable', 'object' ];
  hasOwnProperty = Object.prototype.hasOwnProperty;
  toString = Object.prototype.toString;
  keys = Object.keys;
  slice = Array.prototype.slice;
  isArray = Array.isArray;
  neginf = Number.NEGATIVE_INFINITY;
  posinf = Number.POSITIVE_INFINITY;
  haveSymbols = typeof Symbol === 'function';
  haveMaps = typeof Map === 'function';
  haveSets = typeof Set === 'function';

  functions = mixin(functions, predicates);
  assert = createModifiedPredicates(assertModifier, assertImpl);
  not = createModifiedPredicates(notModifier, notImpl);
  maybe = createModifiedPredicates(maybeModifier, maybeImpl);
  assert.not = createModifiedModifier(assertModifier, not, 'not ');
  assert.maybe = createModifiedModifier(assertModifier, maybe, 'maybe ');

  collections.forEach(createOfPredicates);
  createOfModifiers(assert, assertModifier);
  createOfModifiers(not, notModifier);
  collections.forEach(createMaybeOfModifiers);

  exportFunctions(mixin(functions, {
    assert: assert,
    not: not,
    maybe: maybe
  }));

  /**
   * Public function `equal`.
   *
   * Returns true if `lhs` and `rhs` are strictly equal, without coercion.
   * Returns false otherwise.
   */
  const equal = (lhs, rhs) =>  lhs === rhs;

  /**
   * Public function `undefined`.
   *
   * Returns true if `data` is undefined, false otherwise.
   */
  const isUndefined = (data) => data === undefined;

  /**
   * Public function `null`.
   *
   * Returns true if `data` is null, false otherwise.
   */
  const isNull = (data) => data === null

  /**
   * Public function `assigned`.
   *
   * Returns true if `data` is not null or undefined, false otherwise.
   */
  const assigned = (data) => data !== undefined && data !== null;

  /**
   * Public function `primitive`.
   *
   * Returns true if `data` is a primitive type, false otherwise.
   */
  const primitive = (data) => {
    var type;
    switch (data) {
      case null:
      case undefined:
      case false:
      case true:
        return true;
    }
    type = typeof data;
    return type === 'string' || type === 'number' || (haveSymbols && type === 'symbol');
  }

  /**
   * Public function `zero`.
   *
   * Returns true if `data` is zero, false otherwise.
   */
  const zero = (data) => data === 0;

  /**
   * Public function `one`.
   *
   * Returns true if `data` is one, false otherwise.
   */
  const one = (data) =>  data === 1;

  /**
   * Public function `infinity`.
   *
   * Returns true if `data` is positive or negative infinity, false otherwise.
   */
  const infinity = (data) =>  data === neginf || data === posinf;

  /**
   * Public function `number`.
   *
   * Returns true if `data` is a number, false otherwise.
   */
  const number = (data) => typeof data === 'number' && data > neginf && data < posinf;

  /**
   * Public function `integer`.
   *
   * Returns true if `data` is an integer, false otherwise.
   */
  const integer = (data) => typeof data === 'number' && data % 1 === 0;

  /**
   * Public function `float`.
   *
   * Returns true if `data` is a non-integer number, false otherwise.
   */
  const float = (data) => number(data) && data % 1 !== 0;

  /**
   * Public function `even`.
   *
   * Returns true if `data` is an even number, false otherwise.
   */
  const even = (data) => typeof data === 'number' && data % 2 === 0;

  /**
   * Public function `odd`.
   *
   * Returns true if `data` is an odd number, false otherwise.
   */
  const odd = (data) => integer(data) && data % 2 !== 0;

  /**
   * Public function `greater`.
   *
   * Returns true if `lhs` is a number greater than `rhs`, false otherwise.
   */
  const greater = (lhs, rhs) => number(lhs) && lhs > rhs;

  /**
   * Public function `less`.
   *
   * Returns true if `lhs` is a number less than `rhs`, false otherwise.
   */
  const less = (lhs, rhs) => number(lhs) && lhs < rhs;

  /**
   * Public function `between`.
   *
   * Returns true if `data` is a number between `x` and `y`, false otherwise.
   */
  const between = (data, x, y) => {
    if (x < y) {
      return greater(data, x) && data < y;
    }
    return less(data, x) && data > y;
  }

  /**
   * Public function `greaterOrEqual`.
   *
   * Returns true if `lhs` is a number greater than or equal to `rhs`, false
   * otherwise.
   */
  const greaterOrEqual = (lhs, rhs) => number(lhs) && lhs >= rhs;

  /**
   * Public function `lessOrEqual`.
   *
   * Returns true if `lhs` is a number less than or equal to `rhs`, false
   * otherwise.
   */
  const lessOrEqual = (lhs, rhs) => number(lhs) && lhs <= rhs;

  /**
   * Public function `inRange`.
   *
   * Returns true if `data` is a number in the range `x..y`, false otherwise.
   */
  const inRange = (data, x, y) => {
    if (x < y) {
      return greaterOrEqual(data, x) && data <= y;
    }
    return lessOrEqual(data, x) && data >= y;
  }

  /**
   * Public function `positive`.
   *
   * Returns true if `data` is a positive number, false otherwise.
   */
  const positive = (data) => greater(data, 0);

  /**
   * Public function `negative`.
   *
   * Returns true if `data` is a negative number, false otherwise.
   */
  const negative = (data) => less(data, 0);

  /**
   * Public function `string`.
   *
   * Returns true if `data` is a string, false otherwise.
   */
  const string = (data) => typeof data === 'string';

  /**
   * Public function `emptyString`.
   *
   * Returns true if `data` is the empty string, false otherwise.
   */
  const emptyString = (data) => data === '';

  /**
   * Public function `nonEmptyString`.
   *
   * Returns true if `data` is a non-empty string, false otherwise.
   */
  const nonEmptyString = (data) => string(data) && data !== '';

  /**
   * Public function `match`.
   *
   * Returns true if `data` is a string that matches `regex`, false otherwise.
   */
  const match = (data, regex) => string(data) && !! data.match(regex);

  /**
   * Public function `boolean`.
   *
   * Returns true if `data` is a boolean value, false otherwise.
   */
  const boolean = (data) => data === false || data === true;

  /**
   * Public function `object`.
   *
   * Returns true if `data` is a plain-old JS object, false otherwise.
   */
  const object = (data) => toString.call(data) === '[object Object]';

  /**
   * Public function `emptyObject`.
   *
   * Returns true if `data` is an empty object, false otherwise.
   */
  const emptyObject = (data) => {
    return object(data) && !some(data, () => {
      return true;
    });
  }

  const some = (data, predicate) => {
    for (var key in data) {
      if (hasOwnProperty.call(data, key)) {
        if (predicate(key, data[key])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Public function `nonEmptyObject`.
   *
   * Returns true if `data` is a non-empty object, false otherwise.
   */
  const nonEmptyObject = (data) => {
    return object(data) && some(data, () => {
      return true;
    });
  }

  /**
   * Public function `thenable`.
   *
   * Returns true if `data` has a `then` method.
   */
  const thenable = (data) => assigned(data) && isFunction(data.then);
  
  /**
   * Public function `instanceStrict`.
   *
   * Returns true if `data` is an instance of `prototype`, false otherwise.
   */
  const instanceStrict = (data, prototype)  => {
    try {
      return data instanceof prototype;
    } catch (error) {
      return false;
    }
  }

  /**
   * Public function `instance`.
   *
   * Returns true if `data` is an instance of `prototype`, false otherwise.
   * Falls back to testing constructor.name and Object.prototype.toString
   * if the initial instanceof test fails.
   */
  const instance = (data, prototype) => {
    try {
      return instanceStrict(data, prototype) ||
        data.constructor.name === prototype.name ||
        toString.call(data) === '[object ' + prototype.name + ']';
    } catch (error) {
      return false;
    }
  }

  /**
   * Public function `like`.
   *
   * Tests whether `data` 'quacks like a duck'. Returns true if `data` has all
   * of the properties of `archetype` (the 'duck'), false otherwise.
   */
  const like = (data, archetype) => {
    var name;
    for (name in archetype) {
      if (hasOwnProperty.call(archetype, name)) {
        if (hasOwnProperty.call(data, name) === false || typeof data[name] !== typeof archetype[name]) {
          return false;
        }

        if (object(data[name]) && like(data[name], archetype[name]) === false) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Public function `array`.
   *
   * Returns true if `data` is an array, false otherwise.
   */
  const array = (data) => isArray(data);

  /**
   * Public function `emptyArray`.
   *
   * Returns true if `data` is an empty array, false otherwise.
   */
  const emptyArray = (data) => isArray(data) && data.length === 0;

  /**
   * Public function `nonEmptyArray`.
   *
   * Returns true if `data` is a non-empty array, false otherwise.
   */
  const nonEmptyArray = (data) => isArray(data) && data.length > 0;

  /**
   * Public function `arrayLike`.
   *
   * Returns true if `data` is an array-like object, false otherwise.
   */
  const arrayLike = (data) => assigned(data) && data.length >= 0;

  /**
   * Public function `iterable`.
   *
   * Returns true if `data` is an iterable, false otherwise.
   */
  const iterable = (data) => {
    if (! haveSymbols) {
      // Fall back to `arrayLike` predicate in pre-ES6 environments.
      return arrayLike(data);
    }

    return assigned(data) && isFunction(data[Symbol.iterator]);
  }

  /**
   * Public function `contains`.
   *
   * Returns true if `data` contains `value`, false otherwise.
   * Works with objects, arrays and array-likes (including strings).
   */
  const contains = (data, value) => {
    var iterator, iteration;

    if (! assigned(data)) {
      return false;
    }

    if (haveSets && instanceStrict(data, Set)) {
      return data.has(value);
    }

    if (string(data)) {
      return data.indexOf(value) !== -1;
    }

    if (haveSymbols && data[Symbol.iterator] && isFunction(data.values)) {
      iterator = data.values();

      do {
        iteration = iterator.next();

        if (iteration.value === value) {
          return true;
        }
      } while (! iteration.done);

      return false;
    }

    return some(data, (key, dataValue) => {
      return dataValue === value;
    });
  }

  /**
   * Public function `in`.
   *
   * Returns true if `value` is in `data`, false otherwise.
   * Like `contains`, but with arguments flipped.
   */
  const isIn = (value, data) => contains(data, value);

  /**
   * Public function `containsKey`.
   *
   * Returns true if `data` contains key `key`, false otherwise.
   * Works with objects, arrays and array-likes (including strings).
   */
  const containsKey = (data, key) => {
    if (! assigned(data)) {
      return false;
    }

    if (haveMaps && instanceStrict(data, Map)) {
      return data.has(key);
    }

    if (iterable(data) && ! number(+key)) {
      return false;
    }

    return !! data[key];
  }

  /**
   * Public function `keyIn`.
   *
   * Returns true if key `key` is in `data`, false otherwise.
   * Like `contains`, but with arguments flipped.
   */
  const keyIn = (key, data) => containsKey(data, key);

  /**
   * Public function `hasLength`.
   *
   * Returns true if `data` has a length property that equals `length`, false
   * otherwise.
   */
  const hasLength = (data, length) => assigned(data) && data.length === length;

  /**
   * Public function `date`.
   *
   * Returns true if `data` is a valid date, false otherwise.
   */
  const date = (data) => instanceStrict(data, Date) && integer(data.getTime());

  /**
   * Public function `function`.
   *
   * Returns true if `data` is a function, false otherwise.
   */
  const isFunction = (data) => typeof data === 'function';

  /**
   * Public function `throws`.
   *
   * Returns true if `data` is a function that throws, false otherwise.
   */
  const throws = (data) => {
    if (! isFunction(data)) {
      return false;
    }

    try {
      data();
    } catch (error) {
      return true;
    }

    return false;
  }

  /**
   * Public function `map`.
   *
   * Maps each value from `data` to the corresponding predicate and returns
   * the results. If the same function is to be applied across all of the data,
   * a single predicate function may be passed in.
   */
  const map = (data, predicates) => {
    var result;

    if (isArray(data)) {
      result = [];
    } else {
      result = {};
    }

    if (isFunction(predicates)) {
      forEach(data, (key, value) => {
        result[key] = predicates(value);
      });
    } else {
      if (! isArray(predicates)) {
        assert.object(predicates);
      }

      var dataKeys = keys(data || {});

      forEach(predicates, (key, predicate) => {
        dataKeys.some( (dataKey, index) => {
          if (dataKey === key) {
            dataKeys.splice(index, 1);
            return true;
          }
          return false;
        });

        if (isFunction(predicate)) {
          if (not.assigned(data)) {
            result[key] = !!predicate.m;
          } else {
            result[key] = predicate(data[key]);
          }
        } else {
          result[key] = map(data[key], predicate);
        }
      });
    }

    return result;
  }

  const forEach = (object, action) => {
    for (var key in object) {
      if (hasOwnProperty.call(object, key)) {
        action(key, object[key]);
      }
    }
  }

  /**
   * Public function `all`
   *
   * Check that all boolean values are true
   * in an array or object returned from `map`.
   */
  const all = (data) => {
    if (isArray(data)) {
      return testArray(data, false);
    }
    assert.object(data);
    return testObject(data, false);
  }

  const testArray = (data, result) => {
    var i;
    for (i = 0; i < data.length; i += 1) {
      if (data[i] === result) {
        return result;
      }
    }
    return !result;
  }

  const testObject = (data, result) => {
    var key, value;
    for (key in data) {
      if (hasOwnProperty.call(data, key)) {
        value = data[key];
        if (object(value) && testObject(value, result) === result) {
          return result;
        }
        if (value === result) {
          return result;
        }
      }
    }
    return !result;
  }

  /**
   * Public function `any`
   *
   * Check that at least one boolean value is true
   * in an array or object returned from `map`.
   */
  const any = (data) => {
    if (isArray(data)) {
      return testArray(data, true);
    }
    assert.object(data);
    return testObject(data, true);
  }

  const mixin = (target, source) => {
    forEach(source, (key, value) => {
      target[key] = value;
    });
    return target;
  }

  /**
   * Public modifier `assert`.
   *
   * Throws if `predicate` returns false.
   */
  const assertModifier = (predicate, defaultMessage) => {
    return () => {
      var args = arguments;
      var argCount = predicate.l || predicate.length;
      var message = args[argCount];
      var ErrorType = args[argCount + 1];

      assertImpl(
        predicate.apply(null, args),
        nonEmptyString(message) ? message : defaultMessage
          .replace('{a}', messageFormatter(args[0]))
          .replace('{e}', messageFormatter(args[1]))
          .replace('{e2}', messageFormatter(args[2]))
          .replace('{t}', () => {
            var arg = args[1];
            if (arg && arg.name) {
              return arg.name;
            }
            return arg;
          }),
        isFunction(ErrorType) ? ErrorType : TypeError
      );
      return args[0];
    };
  }

  const messageFormatter = (arg) => {
    return () => {
      if (string(arg)) {
        return '"' + arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
      }
      if (arg && arg !== true && arg.constructor && ! instanceStrict(arg, RegExp) && typeof arg !== 'number') {
        return arg.constructor.name;
      }
      return arg;
    };
  }

  const assertImpl = (value, message, ErrorType) => {
    if (value) {
      return value;
    }
    throw new (ErrorType || Error)(message || 'assert failed');
  }

  /**
   * Public modifier `not`.
   *
   * Negates `predicate`.
   */
  const notModifier = (predicate) => {
    var modifiedPredicate = () => {
      return notImpl(predicate.apply(null, arguments));
    };
    modifiedPredicate.l = predicate.length;
    return modifiedPredicate;
  }

  const notImpl = (value) => !value;

  /**
   * Public modifier `maybe`.
   *
   * Returns true if predicate argument is  null or undefined,
   * otherwise propagates the return value from `predicate`.
   */
  const maybeModifier = (predicate) => {
    var modifiedPredicate = () => {
      if (not.assigned(arguments[0])) {
        return true;
      }
      return predicate.apply(null, arguments);
    };
    modifiedPredicate.l = predicate.length;

    // Hackishly indicate that this is a maybe.xxx predicate.
    // Without this flag, the alternative would be to iterate
    // through the maybe predicates or use indexOf to check,
    // which would be time-consuming.
    modifiedPredicate.m = true;
    return modifiedPredicate;
  }

  const maybeImpl = (value) => {
    if (assigned(value) === false) {
      return true;
    }
    return value;
  }

  /**
   * Public modifier `of`.
   *
   * Applies the chained predicate to members of the collection.
   */
  const ofModifier = (target, type, predicate) => {
    var modifiedPredicate = () => {
      var collection, args;
      collection = arguments[0];
      if (target === 'maybe' && not.assigned(collection)) {
        return true;
      }
      if (!type(collection)) {
        return false;
      }
      collection = coerceCollection(type, collection);
      args = slice.call(arguments, 1);
      try {
        collection.forEach((item) => {
          if (
            (target !== 'maybe' || assigned(item)) &&
            !predicate.apply(null, [ item ].concat(args))
          ) {
            // TODO: Replace with for...of when ES6 is required.
            throw 0;
          }
        });
      } catch (ignore) {
        return false;
      }
      return true;
    };
    modifiedPredicate.l = predicate.length;
    return modifiedPredicate;
  }

  const coerceCollection = (type, collection) => {
    switch (type) {
      case arrayLike:
        return slice.call(collection);
      case object:
        return keys(collection).map((key) => {
          return collection[key];
        });
      default:
        return collection;
    }
  }

  const createModifiedPredicates = (modifier, object) => createModifiedFunctions([ modifier, predicates, object, '' ]);

  const createModifiedFunctions = (args) => {
    var modifier, messageModifier, object, functions;

    modifier = args.shift();
    messageModifier = args.pop();
    object = args.pop();
    functions = args.pop();

    forEach(functions, (key, fn) => {
      var message = messages[key];
      if (message && messageModifier) {
        message = message.replace('to', messageModifier + 'to');
      }

      Object.defineProperty(object, key, {
        configurable: false,
        enumerable: true,
        writable: false,
        value: modifier.apply(null, args.concat(fn, message))
      });
    });
    return object;
  }

  const createModifiedModifier = (modifier, modified, messageModifier) => createModifiedFunctions([ modifier, modified, {}, messageModifier ]);

  const createOfPredicates = (key) => {
    predicates[key].of = createModifiedFunctions(
      [ ofModifier.bind(null, null), predicates[key], predicates, {}, '' ]
    );
  }

  const createOfModifiers = (base, modifier) => {
    collections.forEach((key) => {
      base[key].of = createModifiedModifier(modifier, predicates[key].of);
    });
  }

  const createMaybeOfModifiers = (key) => {
    maybe[key].of = createModifiedFunctions(
      [ ofModifier.bind(null, 'maybe'), predicates[key], predicates, {}, '' ]
    );
    assert.maybe[key].of = createModifiedModifier(assertModifier, maybe[key].of);
    assert.not[key].of = createModifiedModifier(assertModifier, not[key].of);
  }

  const exportFunctions = (functions) => {
    if (typeof define === 'function' && define.amd) {
      define(() => {
        return functions;
      });
    } else if (typeof module !== 'undefined' && module !== null && module.exports) {
      module.exports = functions;
    } else {
      globals.check = functions;
    }
  }
}(this));
