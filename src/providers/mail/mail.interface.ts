export interface MailOptions {
  template?: string;
  data?: Record<string, any>;
  emailVerificationData?: EmailVerificationDto;
  passwordResetData?: PasswordResetDto;
  passwordChangedNotificationData?: PasswordChangedNotificationDto;
  groupInvitationData?: GroupInvitationDto;
  userBackUpCodeAlertData?: UsedBackUpCodeAlertDto;
  mFAEmailResponseData?: MFAEmailResponseDto;
  checkLoginSubnetData?: CheckLoginSubnetDto;
  deactivatedNotificationData?: DeactivatedNotificationDto;
  mergeRequestData?: MergeRequestDto;
  noLayout?: boolean;
}

class EmailVerificationDto {
  name !: string;
  days !: number;
  link !: string;
}

class PasswordResetDto {
  name !: string;
  minutes !: number;
  link !: string;
}

class PasswordChangedNotificationDto {
  name !: string;
}

class GroupInvitationDto {
  name !: string;
  group !: string;
  link !: string;
}

class UsedBackUpCodeAlertDto {
  name !: string;
  locationName !: string;
  link !: string;
}

class MFAEmailResponseDto {
  name !: string;
  minutes !: number;
  link !: string;
}

class CheckLoginSubnetDto {
  name !: string;
  locationName !: string
  minutes !: number;
  link !: string;
}

class DeactivatedNotificationDto {
  name !: string;
}

class MergeRequestDto {
  name !: string;
  minutes !: number;
  link !: string;
}