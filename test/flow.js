import test from 'ava'
import fs from 'fs'
import FlowGenerator from '../plugins/flow.js'

test.beforeEach(t => {
  let json = JSON.parse(fs.readFileSync('./test/recipes.json'), 'utf-8')
  t.context.flow = new FlowGenerator(Object.values(json))
})

test('simple flow', t => {
  let duplicated = {}
  let result = t.context.flow.generate('A', 12, false, duplicated)
  t.is(result.name, 'A')
  t.is(result.count, 1)
  t.is(result.srcNodes.length, 2)
  t.is(result.dstNodes.length, 0)
  t.is(Object.keys(duplicated).length, 0)
  t.is(result.trash['A'], false)
  for (let srcNode of result.srcNodes) {
    t.is(Object.values(srcNode.node.trash)[0], false)
  }
})

test('with goal', t => {
  let duplicated = {}
  let result = t.context.flow.generate('A', 12, true, duplicated)
  t.is(result.name, 'A')
  t.is(result.goal, true)
  t.is(result.srcNodes.length, 1)
  t.is(result.dstNodes.length, 0)
  t.is(Object.keys(duplicated).length, 0)
  t.is(result.trash['A'], false)
  for (let srcNode of result.srcNodes) {
    t.is(Object.values(srcNode.node.trash)[0], false)
  }
})

test('nested flow', t => {
  let duplicated = {}
  let result = t.context.flow.generate('B', 10, false, duplicated)
  t.is(result.name, 'B')
  t.is(result.srcNodes[0].node.name, 'BB')
  t.is(result.srcNodes[0].node.srcNodes[0].node.name, 'BBB')
  t.is(result.srcNodes[0].node.srcNodes[0].node.srcNodes[0].node.name, 'BBBB')
  t.is(result.srcNodes[0].node.srcNodes[0].node.srcNodes[0].items[0].amount, 80)
})

/**
 * C--2--CA--1--CB
 *  `----1-----'
 */
test('same src flow', t => {
  let duplicated = {}
  let result = t.context.flow.generate('C', 10, false, duplicated)
  t.is(result.name, 'C')
  t.is(result.srcNodes.length, 2)
  let srcNodeCA = result.srcNodes.find(node => node.node.name === 'CA')
  t.is(srcNodeCA.items[0].amount, 20)
  let srcNodeCB = result.srcNodes.find(node => node.node.name === 'CB')
  t.is(srcNodeCB.items[0].amount, 10)
  t.is(srcNodeCB.node.dstNodes.length, 2)
  let total =
    srcNodeCB.node.dstNodes[0].items[0].amount +
    srcNodeCB.node.dstNodes[1].items[0].amount
  t.is(total, 30)
})

/**
 * D--(1,1)--(DA, DB)--1--DC
 */
test('two products', t => {
  let duplicated = {}
  let result = t.context.flow.generate('D', 60, false, duplicated)
  t.is(result.name, 'D')
  t.is(result.srcNodes.length, 1)
  t.is(result.srcNodes[0].items.length, 2)
  let srcNodeDC = result.srcNodes[0].node.srcNodes[0]
  t.is(srcNodeDC.node.dstNodes[0].items[0].amount, 60)
})
