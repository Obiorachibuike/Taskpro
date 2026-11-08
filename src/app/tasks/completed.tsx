import React from 'react';
import { FilteredTaskScreen } from '../../components/task/FilteredTaskScreen';
export default function CompletedTasks(){return <FilteredTaskScreen title="Completed" filters={{due:'completed'}}/>;}
