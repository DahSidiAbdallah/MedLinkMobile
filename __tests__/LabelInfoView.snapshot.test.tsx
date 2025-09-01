import React from 'react'
import renderer from 'react-test-renderer'
import LabelInfoView from '../src/components/LabelInfoView'

describe('LabelInfoView snapshot', () => {
  test('renders truncated and expanded blocks', () => {
    const long = 'Line\n'.repeat(200)
    const tree = renderer.create(<LabelInfoView labelInfo={{ indications: long, dosage: long, sideEffects: long }} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
