import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSchema,assertValid } from '../lib/schema.mjs';
import { parseData } from '../lib/data.mjs';

test('tipos, campos requeridos y propiedades adicionales',()=>{
 const schema={type:'object',properties:{name:{type:'string',minLength:1}},required:['name'],additionalProperties:false};
 assert.deepEqual(validateSchema({name:'Caso'},schema),[]);
 assert.equal(validateSchema({},schema).length,1);
 assert.equal(validateSchema({name:2,extra:true},schema).length,2);
});
test('const, enum y tipos nullable',()=>{
 assert.deepEqual(validateSchema(null,{type:['string','null']}),[]);
 assert.equal(validateSchema('x',{const:'y'}).length,1);
 assert.equal(validateSchema('x',{enum:['a','b']}).length,1);
});
test('límites numéricos y números no finitos',()=>{
 assert.equal(validateSchema(Infinity,{type:'number'}).length,1);
 assert.equal(validateSchema(2.5,{type:'integer'}).length,1);
 assert.equal(validateSchema(-1,{type:'number',minimum:0}).length,1);
 assert.equal(validateSchema(4,{type:'number',maximum:3}).length,1);
});
test('cadenas Unicode, patrones y límites',()=>{
 assert.deepEqual(validateSchema('😀',{type:'string',minLength:1,maxLength:1}),[]);
 assert.equal(validateSchema('A',{pattern:'^[a-z]+$'}).length,1);
 assert.equal(validateSchema('',{minLength:1}).length,1);
});
test('arrays con longitud, items y unicidad estructural',()=>{
 assert.equal(validateSchema([1,'x'],{type:'array',items:{type:'number'}}).length,1);
 assert.equal(validateSchema([],{minItems:1}).length,1);
 assert.equal(validateSchema([1,2],{maxItems:1}).length,1);
 assert.equal(validateSchema([{a:1,b:2},{b:2,a:1}],{uniqueItems:true}).length,1);
});
test('referencias locales y contratos anidados',()=>{
 const schema={$defs:{item:{type:'integer',minimum:0}},type:'object',properties:{value:{$ref:'#/$defs/item'}}};
 assert.deepEqual(validateSchema({value:2},schema),[]);
 assert.equal(validateSchema({value:-1},schema).length,1);
 assert.throws(()=>validateSchema(1,{$ref:'#/$defs/missing'}),/inexistente/u);
});
test('rechaza keywords y referencias remotas no soportadas',()=>{
 assert.throws(()=>validateSchema({}, {oneOf:[]}),/no soportada/u);
 assert.throws(()=>validateSchema({}, {$ref:'https://invalid.example/schema'}),/locales/u);
 assert.throws(()=>validateSchema({}, {type:'mystery'}),/desconocido/u);
});
test('assertValid propaga errores útiles',()=>{
 assert.throws(()=>assertValid({a:1},{type:'object',required:['b']},'demo'),/demo.*\n.*falta b/u);
});
test('rechaza esquemas mal formados sin ignorar errores de contrato',()=>{
 for(const schema of [{required:'name'},{type:[]},{minItems:-1},{uniqueItems:'yes'},{properties:[]},{enum:[]}])assert.throws(()=>validateSchema({},schema));
});
test('parser rechaza claves duplicadas y YAML fuera del subconjunto',()=>{
 assert.throws(()=>parseData('{"enabled":false,"enabled":true}'),/duplicada/u);
 assert.throws(()=>parseData('{"a":1,"\\u0061":2}'),/duplicada/u);
 assert.throws(()=>parseData('enabled: false'));
 assert.deepEqual(parseData('{"a":{"id":1},"b":{"id":2},"text":"{\\"key\\":1}"}'),{a:{id:1},b:{id:2},text:'{"key":1}'});
});
