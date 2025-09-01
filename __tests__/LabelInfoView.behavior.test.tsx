import React from 'react'
import renderer from 'react-test-renderer'
import LabelInfoView from '../src/components/LabelInfoView'
import { TouchableOpacity } from 'react-native'

describe('LabelInfoView modal behavior', () => {
  test('pressing Read more opens modal (onPress triggers)', () => {
    const long = 'A'.repeat(800)
    const comp = renderer.create(<LabelInfoView labelInfo={{ indications: long, dosage: long, sideEffects: long }} />)
    const root = comp.root
    // Find first TouchableOpacity (the Read more for the first field)
    const buttons = root.findAllByType(TouchableOpacity)
    expect(buttons.length).toBeGreaterThan(0)
    // Simulate press by invoking the onPress prop directly
    const readMore = buttons[0]
    readMore.props.onPress()
    // Re-render and snapshot modal-open state
    const tree = comp.toJSON()
    expect(tree).toMatchSnapshot()
  })
})
