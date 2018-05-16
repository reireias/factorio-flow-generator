import test from 'ava'
import fs from 'fs'
import Converter from '../plugins/converter.js'
import FlowGenerator from '../plugins/flow.js'

test.beforeEach(t => {
  let locales = JSON.parse(fs.readFileSync('./test/locales.json'), 'utf-8')
  t.context.converter = new Converter(locales)
})

test('load', t => {
  let converter = t.context.converter
  t.true('section1' in converter.locales)
  t.is(converter.locales.section1.resource1, 'リソース1')
  t.is(converter.locales.section1.resource2, 'リソース2')
})

test('getResource', t => {
  let converter = t.context.converter
  let result = converter.getResource('resource1')
  t.is(result, 'リソース1')
})

test('parseResource', t => {
  let converter = t.context.converter
  let result = converter.parseResource('リソース1')
  t.is(result, 'resource1')
})

test('convert', t => {
  let converter = t.context.converter
  let recipes = Object.values(
    JSON.parse(fs.readFileSync('./test/recipes.json'), 'utf-8')
  )
  let flow = new FlowGenerator(recipes)
  let root = flow.generate('A', 12, true)
  let result = converter.convert(root)
  t.is(result[0], 'graph TD')
  t.is(result[1], '0001 --> |A: 12|0004(A)')
  t.is(
    result[2],
    '0002(AA) --> |AA: 12|0001[recipe of A<br>&lt categoryA &gt<br>1]'
  )
  t.is(result[3], '0003(AB) --> |AB: 12|0001')
})
