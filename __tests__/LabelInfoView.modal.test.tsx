import React from 'react'
import renderer from 'react-test-renderer'
import LabelInfoView from '../src/components/LabelInfoView'

describe('LabelInfoView modal snapshot', () => {
  test('renders truncated fields and modal open state snapshot', () => {
    const long = 'A'.repeat(800)
    const tree = renderer.create(<LabelInfoView labelInfo={{ indications: long, dosage: long, sideEffects: long }} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
