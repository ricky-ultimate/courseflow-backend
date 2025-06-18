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
        validate(value: any) {
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
          const [startTimePropertyName] = args.constraints as string[];
          const validationObject = args.object as Record<string, any>;
          const startTime = validationObject[startTimePropertyName];

          if (!startTime || !value) return true;

          if (typeof startTime !== 'string' || typeof value !== 'string') {
            return false;
          }

          const startTimeParts = startTime.split(':');
          const endTimeParts = value.split(':');

          if (startTimeParts.length !== 2 || endTimeParts.length !== 2) {
            return false;
          }

          const startHour = parseInt(startTimeParts[0], 10);
          const startMin = parseInt(startTimeParts[1], 10);
          const endHour = parseInt(endTimeParts[0], 10);
          const endMin = parseInt(endTimeParts[1], 10);

          if (
            isNaN(startHour) ||
            isNaN(startMin) ||
            isNaN(endHour) ||
            isNaN(endMin)
          ) {
            return false;
          }

          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;

          return endMinutes > startMinutes;
        },
        defaultMessage() {
          return 'End time must be after start time';
        },
      },
    });
  };
}
