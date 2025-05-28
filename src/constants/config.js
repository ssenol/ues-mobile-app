// Rastgele sayı üretme fonksiyonu (min ve max dahil)
const getRandomScore = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const DEBUG_MODE = false; // Geliştirme bitince false yapılacak

export const DUMMY_SPEECH_REPORT = {
  evaluation: {
    results: [
      {
        Duration: 65000000, // mikrosaniye cinsinden
        NBest: [
          {
            PronunciationAssessment: {
              AccuracyScore: getRandomScore(40, 85),
              FluencyScore: getRandomScore(40, 85),
              CompletenessScore: getRandomScore(40, 85),
              ProsodyScore: getRandomScore(40, 85),
              PronScore: getRandomScore(40, 85),
            },
            DisplayText:
              "Bu bir örnek konuşma metnidir. Değerlendirme için kullanılacak dummy data içerir.",
          },
        ],
      },
    ],
  },
  topicScore: {
    data: {
      score: getRandomScore(40, 100),
    },
    status_code: 200,
    success: true,
  },
  aiEvaluation: {
    status: "success",
    status_code: 200,
    successed: true,
    data: {
      suggestion: [
        {
          type: "content-relevance",
          feedback:
            "[dummytext] Dear quizmaker-admin, your response touches on the idea that artificial intelligence can be an opportunity, which is a good start. However, it would be helpful to explain why you believe this. Try to add more details and examples to strengthen your argument.",
        },
        {
          type: "tone-and-perspective",
          feedback:
            "[dummytext] Dear quizmaker-admin, you have a positive tone, which helps make your point relatable. It's important to maintain this positive perspective while elaborating on your ideas. Ensure you express your views clearly to engage your audience.",
        },
        {
          type: "performance-summary",
          feedback:
            "[dummytext] Dear quizmaker-admin, your performance shows strong accuracy and fluency, which is great to see. However, the length of your response did not meet expectations, as it was quite brief. You did well in completeness, but adding more sentences would help to create a fuller picture. Also, working on prosody can improve the way you deliver your message. Keep practicing to enhance these aspects.",
        },
        {
          type: "suggestions-for-improvement",
          feedback:
            "[dummytext] Dear quizmaker-admin, to improve your response, aim to extend your speech to meet the required length of 20-40 seconds. Include more reasons for why you see artificial intelligence as an opportunity, perhaps mentioning specific jobs that may benefit. Practice speaking in complete sentences to help with overall structure. Work on varying your speaking tone for better prosody. Finally, consider connecting your ideas back to the topic more clearly.",
        },
      ],
      mistakes: null,
      rubricEvaluationResult:
        "Fluency and Coherence \n ??? Detail: Speaks with long pauses has limited ability to link simple sentences gives only simple responses and is frequently unable to convey basic message. \n ??? Score : 3 / 9***Lexical Resource \n ??? Detail: Uses simple vocabulary to convey personal information has insufficient vocabulary for less familiar topics. \n ??? Score : 3 / 9***Grammatical Range & Accuracy \n ??? Detail: Attempts basic sentence forms but with limited success, or relies on apparently memorised utterances makes numerous errors except in memorised expressions. \n ??? Score : 3 / 9***Pronunciation \n ??? Detail: Uses a limited range of pronunciation features attempts to control features but lapses are frequent mispronunciations are frequent and cause some difficulty for the listener. \n ??? Score : 4 / 9",
    },
  },
};
