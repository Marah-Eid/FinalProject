// Shared API types — mirror the .NET DTOs in Dorm.Application/DTOs.
//
// Enum numeric values MUST match the backend's enum ordinals (defined in
// Dorm.Domain/Enums). Changes here without backend changes will silently
// break the wire format.

export const UserRole = {
  Student: 0,
  Owner: 1,
  Admin: 2,
} as const
export type UserRole = typeof UserRole[keyof typeof UserRole]

export const Gender = {
  Male: 0,
  Female: 1,
} as const
export type Gender = typeof Gender[keyof typeof Gender]

export const University = {
  JU: 0,
  GJU: 1,
  PSUT: 2,
  YU: 3,
  HU: 4,
  MU: 5,
  ZU: 6,
  BAU: 7,
  JUST: 8,
  AAU: 9,
} as const
export type University = typeof University[keyof typeof University]

export const UniversityCodes: Record<University, string> = {
  0: 'JU', 1: 'GJU', 2: 'PSUT', 3: 'YU', 4: 'HU',
  5: 'MU', 6: 'ZU', 7: 'BAU', 8: 'JUST', 9: 'AAU',
}

export const City = {
  Amman: 0,
  Irbid: 1,
  Zarqa: 2,
} as const
export type City = typeof City[keyof typeof City]

export const CityCodes: Record<City, string> = { 0: 'Amman', 1: 'Irbid', 2: 'Zarqa' }

export const AmenityType = {
  WiFi: 0,
  AC: 1,
  Heating: 2,
  WashingMachine: 3,
  Parking: 4,
  Furnished: 5,
  Elevator: 6,
  Balcony: 7,
  Kitchen: 8,
  PrivateBathroom: 9,
} as const
export type AmenityType = typeof AmenityType[keyof typeof AmenityType]

export const AmenityCodes: Record<AmenityType, string> = {
  0: 'WiFi', 1: 'AC', 2: 'Heating', 3: 'WashingMachine', 4: 'Parking',
  5: 'Furnished', 6: 'Elevator', 7: 'Balcony', 8: 'Kitchen', 9: 'PrivateBathroom',
}

export const GenderType = {
  MaleOnly: 0,
  FemaleOnly: 1,
  Mixed: 2,
} as const
export type GenderType = typeof GenderType[keyof typeof GenderType]

export const GenderTypeCodes: Record<GenderType, string> = {
  0: 'MaleOnly', 1: 'FemaleOnly', 2: 'Mixed',
}

export const SmokingRule = { Yes: 0, No: 1, Outside: 2 } as const
export type SmokingRule = typeof SmokingRule[keyof typeof SmokingRule]
export const SmokingRuleCodes: Record<SmokingRule, string> = { 0: 'Yes', 1: 'No', 2: 'Outside' }

export const GuestsRule = { Yes: 0, No: 1, Limited: 2 } as const
export type GuestsRule = typeof GuestsRule[keyof typeof GuestsRule]
export const GuestsRuleCodes: Record<GuestsRule, string> = { 0: 'Yes', 1: 'No', 2: 'Limited' }

export const QuizQuestionKey = {
  SleepSchedule: 0,
  Cleanliness: 1,
  Smoking: 2,
  StudyHabits: 3,
  SocialStyle: 4,
  Guests: 5,
  Cooking: 6,
  PetTolerance: 7,
} as const
export type QuizQuestionKey = typeof QuizQuestionKey[keyof typeof QuizQuestionKey]

export const QuizQuestionCodes: Record<QuizQuestionKey, string> = {
  0: 'SleepSchedule', 1: 'Cleanliness', 2: 'Smoking', 3: 'StudyHabits',
  4: 'SocialStyle', 5: 'Guests', 6: 'Cooking', 7: 'PetTolerance',
}

export type User = {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  role: UserRole
  gender: Gender
  isEmailVerified: boolean
  isUniversityVerified: boolean
  profilePhotoUrl: string | null
  university: University | null
  createdAt: string
}

export type AuthResponse = {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
  user: User
}

export type RegisterRequest = {
  fullName: string
  email: string
  password: string
  role: UserRole
  gender: Gender
  phoneNumber: string
  university?: University | null
}

export type LoginRequest = { email: string; password: string }
export type ForgotPasswordRequest = { email: string }
export type ResetPasswordRequest = { token: string; newPassword: string }

// ── Apartments ──────────────────────────────────────────────────────────────

export type ApartmentPhotoDto = {
  id: string
  photoUrl: string
  displayOrder: number
}

export type OwnerSnippetDto = {
  id: string
  fullName: string
  profilePhotoUrl: string | null
  averageRating: number | null
  ratingsCount: number
  memberSince: string
}

export type CurrentTenantDto = {
  firstName: string
  year: number | null
  major: string | null
  compatibilityScore: number | null
}

export type ApartmentListItem = {
  id: string
  title: string
  city: City
  neighborhood: string
  pricePerPerson: number
  fullRent: number
  totalSpots: number
  availableSpots: number
  genderType: GenderType
  isFurnished: boolean
  nearestUniversity: University
  distanceMinutes: number
  mainPhotoUrl: string | null
  isFeatured: boolean
  ownerAverageRating: number | null
  ownerRatingsCount: number
  compatibilityScore: number | null
  createdAt: string
}

export type ApartmentDetail = {
  id: string
  title: string
  description: string
  city: City
  neighborhood: string
  /** null unless caller is the owner or has an Accepted application. */
  addressDetail: string | null
  latitude: number
  longitude: number
  fullRent: number
  pricePerPerson: number
  totalSpots: number
  availableSpots: number
  genderType: GenderType
  isFurnished: boolean
  nearestUniversity: University
  distanceMinutes: number
  smokingRule: SmokingRule
  guestsRule: GuestsRule
  amenities: AmenityType[]
  photos: ApartmentPhotoDto[]
  currentTenants: CurrentTenantDto[]
  owner: OwnerSnippetDto
  ownerPhoneNumber: string | null
  isFeatured: boolean
  featuredUntil: string | null
  isActive: boolean
  isSuspended: boolean
  compatibilityScore: number | null
  createdAt: string
}

export type ApartmentListFilters = {
  city?: City
  neighborhood?: string
  university?: University
  minPrice?: number
  maxPrice?: number
  spotsAvailable?: number
  furnished?: boolean
  amenities?: AmenityType[]
  maxDistance?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'highest_match'
  page?: number
  pageSize?: number
}

export type PaginatedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type CreateApartmentRequest = {
  title: string
  description: string
  city: City
  neighborhood: string
  addressDetail: string
  latitude: number
  longitude: number
  fullRent: number
  totalSpots: number
  availableSpots: number
  genderType: GenderType
  isFurnished: boolean
  nearestUniversity: University
  distanceMinutes: number
  smokingRule: SmokingRule
  guestsRule: GuestsRule
  amenities: AmenityType[]
}

export type UpdateApartmentRequest = CreateApartmentRequest & { isActive?: boolean }

// ── Quiz ────────────────────────────────────────────────────────────────────

export type QuizQuestion = {
  key: QuizQuestionKey
  options: string[]
}

export type QuizQuestions = { questions: QuizQuestion[] }

export type QuizAnswerDto = {
  questionKey: QuizQuestionKey
  answerValue: string
}

export type SaveQuizAnswersRequest = { answers: QuizAnswerDto[] }
export type QuizMyAnswers = { quizCompleted: boolean; answers: QuizAnswerDto[] }

// ── Compatibility ──────────────────────────────────────────────────────────

export type CompatibilityBreakdown = {
  score: number
  matchedOn: QuizQuestionKey[]
  differedOn: QuizQuestionKey[]
  tenantsCount: number
}

// ── Applications ────────────────────────────────────────────────────────────

export const ApplicationStatus = {
  Pending: 0,
  Accepted: 1,
  Rejected: 2,
  Withdrawn: 3,
} as const
export type ApplicationStatus = typeof ApplicationStatus[keyof typeof ApplicationStatus]

export const ApplicationStatusCodes: Record<ApplicationStatus, string> = {
  0: 'Pending', 1: 'Accepted', 2: 'Rejected', 3: 'Withdrawn',
}

export type ApplicationDto = {
  id: string
  apartmentId: string
  apartmentTitle: string
  apartmentNeighborhood: string
  apartmentMainPhotoUrl: string | null
  message: string
  compatibilityScore: number
  status: ApplicationStatus
  createdAt: string
  respondedAt: string | null
}

export type ApplyRequest = { message: string }

/** Owner-facing application row — extends the student-facing shape with student info. */
export type ApplicationReceivedDto = {
  id: string
  apartmentId: string
  apartmentTitle: string
  studentId: string
  studentFullName: string
  studentProfilePhotoUrl: string | null
  studentUniversity: University | null
  studentIsUniversityVerified: boolean
  studentYear: number | null
  studentMajor: string | null
  compatibilityScore: number
  message: string
  status: ApplicationStatus
  createdAt: string
  respondedAt: string | null
}

// ── Messaging ───────────────────────────────────────────────────────────────

export type ConversationDto = {
  id: string
  apartmentId: string
  apartmentTitle: string
  apartmentMainPhotoUrl: string | null
  otherUserId: string
  otherUserName: string
  otherUserProfilePhotoUrl: string | null
  lastMessageContent: string | null
  lastMessageSenderId: string | null
  lastMessageAt: string
  unreadCount: number
}

export type MessageDto = {
  id: string
  conversationId: string
  senderId: string
  content: string
  isRead: boolean
  sentAt: string
}

export type SendMessageRequest = { content: string }

// ── Notifications ───────────────────────────────────────────────────────────

export const NotificationType = {
  NewApplicationReceived: 0,
  ApplicationAccepted: 1,
  ApplicationRejected: 2,
  NewMessage: 3,
  NewRating: 4,
  ListingSuspended: 5,
} as const
export type NotificationType = typeof NotificationType[keyof typeof NotificationType]

export type NotificationDto = {
  id: string
  type: NotificationType
  title: string
  content: string
  isRead: boolean
  relatedEntityId: string | null
  createdAt: string
}

export type NotificationListResponse = {
  items: NotificationDto[]
  unread: number
}

// ── Payments ────────────────────────────────────────────────────────────────

export const PaymentType = {
  MatchCommission: 0,
  FeaturedListing: 1,
  VerifiedBadge: 2,
} as const
export type PaymentType = typeof PaymentType[keyof typeof PaymentType]

export const PaymentTypeCodes: Record<PaymentType, string> = {
  0: 'MatchCommission', 1: 'FeaturedListing', 2: 'VerifiedBadge',
}

export const PaymentAmount: Record<PaymentType, number> = {
  0: 15, 1: 10, 2: 2,
}

export const PaymentStatus = {
  Pending: 0,
  Completed: 1,
  Failed: 2,
} as const
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus]

export const PaymentStatusCodes: Record<PaymentStatus, string> = {
  0: 'Pending', 1: 'Completed', 2: 'Failed',
}

export type PaymentDto = {
  id: string
  type: PaymentType
  amount: number
  status: PaymentStatus
  transactionRef: string | null
  createdAt: string
}

export type CheckoutRequest = {
  type: PaymentType
  relatedEntityId?: string | null
}

// ── Ratings ─────────────────────────────────────────────────────────────────

export type RatingDto = {
  id: string
  raterId: string
  raterName: string
  raterProfilePhotoUrl: string | null
  apartmentId: string
  apartmentTitle: string
  stars: number
  comment: string | null
  createdAt: string
}

export type SubmitRatingRequest = {
  ratedUserId: string
  apartmentId: string
  stars: number
  comment?: string | null
}

// ── Reports ─────────────────────────────────────────────────────────────────

export const ReportReason = {
  FakeListing: 0,
  MisleadingPhotos: 1,
  Scam: 2,
  Inappropriate: 3,
  Other: 4,
} as const
export type ReportReason = typeof ReportReason[keyof typeof ReportReason]

export const ReportReasonCodes: Record<ReportReason, string> = {
  0: 'FakeListing', 1: 'MisleadingPhotos', 2: 'Scam', 3: 'Inappropriate', 4: 'Other',
}

export const ReportStatus = {
  Pending: 0,
  Resolved: 1,
  Dismissed: 2,
} as const
export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus]

export const ReportStatusCodes: Record<ReportStatus, string> = {
  0: 'Pending', 1: 'Resolved', 2: 'Dismissed',
}

export type SubmitReportRequest = {
  apartmentId: string
  reason: ReportReason
  description?: string | null
}

export type ReportDto = {
  id: string
  reportedApartmentId: string
  apartmentTitle: string
  reporterId: string
  reporterName: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
}

export type ResolveReportRequest = { dismiss?: boolean }

// ── Admin ───────────────────────────────────────────────────────────────────

export type RevenueByTypeRow = {
  type: PaymentType
  count: number
  total: number
}

export type AdminDashboardDto = {
  totalUsers: number
  totalStudents: number
  totalOwners: number
  activeListings: number
  suspendedListings: number
  tenanciesThisMonth: number
  activeTenancies: number
  pendingReports: number
  revenueThisMonthJod: number
  revenueAllTimeJod: number
  revenueByType: RevenueByTypeRow[]
}

export type AdminUserDto = {
  id: string
  fullName: string
  email: string
  role: UserRole
  gender: Gender
  isEmailVerified: boolean
  isUniversityVerified: boolean
  isBanned: boolean
  createdAt: string
}

export type AdminApartmentDto = {
  id: string
  title: string
  neighborhood: string
  city: City
  ownerId: string
  ownerName: string
  availableSpots: number
  totalSpots: number
  isActive: boolean
  isSuspended: boolean
  pendingReportsCount: number
  createdAt: string
}

// Wire format of every error from the backend, produced by
// GlobalExceptionMiddleware.
export type ApiErrorEnvelope = {
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}
