import React from 'react';
import { fireEvent,render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ui from '../store/slices/uiSlice';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
const store=configureStore({reducer:{ui}});
describe('accessible common components',()=>{it('invokes button actions and exposes busy state',()=>{const onPress=jest.fn();const view=render(<Provider store={store}><Button title="Save" onPress={onPress}/><Button title="Loading" onPress={jest.fn()} loading/></Provider>);fireEvent.press(view.getByRole('button',{name:'Save'}));expect(onPress).toHaveBeenCalled();expect(view.getByRole('button',{name:'Loading'})).toBeDisabled();});it('renders empty state action',()=>{const action=jest.fn();const view=render(<Provider store={store}><EmptyState title="No tasks" message="Start now" action="Add" onAction={action}/></Provider>);fireEvent.press(view.getByText('Add'));expect(action).toHaveBeenCalled();});});
