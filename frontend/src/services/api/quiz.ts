import { http } from '../../lib/http'
import type { QuizMyAnswers, QuizQuestions, SaveQuizAnswersRequest } from '../../utils/types'

export const quizApi = {
  questions: () => http.get<QuizQuestions>('/quiz/questions').then((r) => r.data),
  saveAnswers: (req: SaveQuizAnswersRequest) =>
    http.post<void>('/quiz/answers', req).then((r) => r.data),
  myAnswers: () => http.get<QuizMyAnswers>('/quiz/my-answers').then((r) => r.data),
}
