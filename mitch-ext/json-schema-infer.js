'use strict';

/*
  typeArray(val)
  used to get array values
*/
function typeArray(val) {
  var r = [];
  val.forEach( function (v) {
    var type = typeof v;        // FIXME: this would need to be able
                                // to handle dictionaries
                                // an array like 'arr': [{'key1':'val1'},0,2.3]
                                // should translate in
                                // 'arr': {'items': {'anyOf': [{'type': 'number'},
                                //                     {'properties': {'key1': {'type': 'string'}},
                                //                      'required': ['key1'],
                                //                      'type': 'object'}]},
                                //        'type': 'array'}
  if (!r.includes(type))
      r.push(type);
  });

  return {'type': r};
}

/*
  typeValue(value)
  returns a string representing the type of value as recognized by
  the typeof function with some more types added
  in case of dicitionaries it returns again a dictionary
  typing all its keys' values
*/

function typeValue(val) {
  if (Array.isArray(val)) {
    return {'type': 'array', 'items': typeArray(val)};
  }
  
  if (typeof val == 'object') {
    var properties = getProperties(val);
    return {'type': 'object', 'properties': properties, 'required': Object.keys(properties)};
  }
  
  if (typeof val == 'number' && Number.isInteger(val)) {
    return {'type': 'integer'}
  }

  return { 'type': typeof val };
}

/*
  getProperties(JSONobject)
  returns a typed properties list composed by the same keys with
  values replaced with their types using the typeValue function
  in case of contained dictionaries it gets called recursively by
  the typeValue(val)
*/

function getProperties(j) {
  var k = Object.keys(j);
  
  k.forEach(function(name) {
    j[name] = typeValue(j[name]);
  })
  
  return j;
}


function getSchema(json_object) {
  var schema = {};

  schema['$schema'] = 'http://json-schema.org/schema#';
  schema['title'] = 'JSON inferred schema';
  schema['description'] = 'JSON inferred schema';
  schema['type']  = 'object';
  schema['properties'] = getProperties(json_object);
  schema['required'] = Object.keys(schema['properties']);

  return schema;
}