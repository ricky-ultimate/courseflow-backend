import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsTimeFormat(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTimeFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          return typeof value === 'string' && timeRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in HH:MM format (24-hour)`;
        },
      },
    });
  };
}

export function IsEndTimeAfterStartTime(
  startTimeProperty: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEndTimeAfterStartTime',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [startTimeProperty],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [startTimeProperty] = args.constraints;
          const startTime = (args.object as any)[startTimeProperty];

          if (!startTime || !value) return true;

          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = value.split(':').map(Number);

          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;

          return endMinutes > startMinutes;
        },
        defaultMessage(args: ValidationArguments) {
          return 'End time must be after start time';
        },
      },
    });
  };
}
