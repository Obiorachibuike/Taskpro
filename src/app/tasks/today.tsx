import React from 'react';
import { FilteredTaskScreen } from '../../components/task/FilteredTaskScreen';
export default function TodayTasks(){return <FilteredTaskScreen title="Today" filters={{due:'today'}}/>;}
