import moment from 'moment';

export const convertMinutesToHoursAndMinutes = (totalMinutes: number) => {
  const duration = moment.duration(totalMinutes, 'minutes');
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();

  return { hours, minutes };
};
