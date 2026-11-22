/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import '../test-utils/temporal-mock.js';
import { DatePickerStateMachine } from '../machine';
import { DatePickerEvent, DatePickerState } from '../states';

function openAndSelectSingle(machine, date) {
  machine.send(DatePickerEvent.INPUT_FOCUS, { inputType: 'from' });
  machine.send(DatePickerEvent.CALENDAR_OPEN);
  return machine.send(DatePickerEvent.DATE_SELECT, { date });
}

describe('DatePickerStateMachine closeOnSelect', () => {
  it('keeps the calendar open after DATE_SELECT when closeOnSelect is false', () => {
    const machine = new DatePickerStateMachine({
      mode: 'single',
      closeOnSelect: false,
    });
    const date = Temporal.PlainDate.from('2026-01-01');

    const context = openAndSelectSingle(machine, date);

    expect(machine.getState()).toBe(DatePickerState.DATE_SELECTED);
    expect(context.isOpen).toBe(true);
    expect(context.startDate?.toString()).toBe('2026-01-01');
    expect(context.shouldRestoreFocus).toBe(false);
  });

  it('updates the selection on a second DATE_SELECT while still open', () => {
    const machine = new DatePickerStateMachine({
      mode: 'single',
      closeOnSelect: false,
    });
    const first = Temporal.PlainDate.from('2026-01-01');
    const second = Temporal.PlainDate.from('2026-01-15');

    openAndSelectSingle(machine, first);
    const context = machine.send(DatePickerEvent.DATE_SELECT, { date: second });

    expect(machine.getState()).toBe(DatePickerState.DATE_SELECTED);
    expect(context.isOpen).toBe(true);
    expect(context.startDate?.toString()).toBe('2026-01-15');
  });

  it('closes the calendar on OUTSIDE_CLICK from DATE_SELECTED', () => {
    const machine = new DatePickerStateMachine({
      mode: 'single',
      closeOnSelect: false,
    });
    const date = Temporal.PlainDate.from('2026-01-01');

    openAndSelectSingle(machine, date);
    const context = machine.send(DatePickerEvent.OUTSIDE_CLICK);

    expect(machine.getState()).toBe(DatePickerState.IDLE);
    expect(context.isOpen).toBe(false);
  });

  it('reopens the calendar from DATE_SELECTED via CALENDAR_ICON_CLICK', () => {
    const machine = new DatePickerStateMachine({
      mode: 'single',
      closeOnSelect: true,
    });
    const date = Temporal.PlainDate.from('2026-01-01');

    openAndSelectSingle(machine, date);
    expect(machine.getContext().isOpen).toBe(false);
    expect(machine.getState()).toBe(DatePickerState.DATE_SELECTED);

    const context = machine.send(DatePickerEvent.CALENDAR_ICON_CLICK);

    expect(machine.getState()).toBe(DatePickerState.CALENDAR_OPEN);
    expect(context.isOpen).toBe(true);
  });

  it('honours closeOnSelect false when committing a range end', () => {
    const machine = new DatePickerStateMachine({
      mode: 'range',
      closeOnSelect: false,
    });
    const start = Temporal.PlainDate.from('2026-01-01');
    const end = Temporal.PlainDate.from('2026-01-10');

    machine.send(DatePickerEvent.INPUT_FOCUS, { inputType: 'from' });
    machine.send(DatePickerEvent.CALENDAR_OPEN);
    machine.send(DatePickerEvent.RANGE_START_SELECT, { date: start });
    const context = machine.send(DatePickerEvent.RANGE_END_SELECT, {
      date: end,
    });

    expect(machine.getState()).toBe(DatePickerState.DATE_SELECTED);
    expect(context.isOpen).toBe(true);
    expect(context.startDate?.toString()).toBe('2026-01-01');
    expect(context.endDate?.toString()).toBe('2026-01-10');
    expect(context.shouldRestoreFocus).toBe(false);
  });
});
