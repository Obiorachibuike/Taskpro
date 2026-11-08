import React from 'react';
import { FilteredTaskScreen } from '../../components/task/FilteredTaskScreen';
export default function UpcomingTasks(){return <FilteredTaskScreen title="Upcoming" filters={{due:'upcoming'}}/>;}
