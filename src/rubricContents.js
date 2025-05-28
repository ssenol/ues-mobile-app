// Tüm rubric içerikleri sadeleştirilmiş biçimde burada tutulur.
// Anahtar: writingTypeName veya rubric kodu (örn: "creative", "ielts-general-task1" ...)
// İçerik: Sadece <strong>, <ul>/<ol>/<li>, <br>, \n, <p> gibi temel HTML ile (renk, font, stil, inline CSS yok)

const rubricContents = {
  creative: `
<p><strong>Creative Writing Rubric Detailed Overview</strong></p>
<p>This rubric assesses creative writing, focusing on originality, imaginative expression, and narrative techniques. It is intended to inspire creativity while ensuring that the stories are engaging and structurally sound.</p>
<p><strong>Key Evaluation Criteria</strong></p>
<ul>
  <li><strong>Originality:</strong> Measures the uniqueness and novelty of ideas and plots.</li>
  <li><strong>Creative Expression:</strong> Assesses the ability to convey themes and emotions through innovative narrative techniques and rich descriptive language.</li>
  <li><strong>Narrative Structure:</strong> Evaluates the coherence of the plot and the effectiveness of the narrative pacing.</li>
  <li><strong>Character Development:</strong> Reviews how characters are crafted and developed across the narrative arc.</li>
</ul>
<p><strong>Strategies for Success</strong></p>
<ol>
  <li>Inject uniqueness into your story to stand out; avoid clichés.</li>
  <li>Develop dynamic characters whose motivations and transformations drive the narrative.</li>
  <li>Ensure that your plot has moments of tension and resolution to keep readers engaged.</li>
  <li>Utilize a variety of literary devices to enhance the narrative style and voice.</li>
</ol>
`,

  "ielts-general-task1": `
<p><strong>IELTS General Training Task 1 Rubric Overview</strong></p>
<p>The IELTS General Training Task 1 rubric assesses the candidate's ability to communicate effectively in letter writing within an everyday context. This may involve writing letters to companies, landlords, colleagues, or friends, addressing a wide range of topics.</p>
<p><strong>Objectives of the Rubric</strong></p>
<ul>
  <li>To evaluate the ability to follow letter-writing conventions appropriately.</li>
  <li>To assess how effectively the response addresses the requirements of the prompt.</li>
  <li>To gauge the appropriateness of the style and tone in relation to the intended audience.</li>
  <li>To measure the range and accuracy of vocabulary and grammatical structures used.</li>
</ul>
<p><strong>Evaluation Criteria</strong></p>
<ul>
  <li><strong>Task Achievement:</strong> The extent to which the candidate fulfills the requirements of the task, providing a response that appropriately addresses the situation.</li>
  <li><strong>Coherence and Cohesion:</strong> The organisation and clarity of the letter, including the effectiveness of the structure and the usage of linking words.</li>
  <li><strong>Lexical Resource:</strong> The range of vocabulary used and how appropriately it is used to express ideas and achieve precise meaning.</li>
  <li><strong>Grammatical Range and Accuracy:</strong> The accuracy and range of grammatical constructions used are assessed.</li>
</ul>
<p><strong>Tips for Maximizing Scores</strong></p>
<ol>
  <li><strong>Understand the Prompt:</strong> Make sure to fully understand what the task prompt asks you to do and ensure all elements are covered in your letter.</li>
  <li><strong>Plan Your Letter:</strong> Organize your thoughts and plan the layout of your letter to ensure it is logical and easy to follow.</li>
  <li><strong>Adjust Your Tone:</strong> Adapt your tone according to the context and the recipient to make your letter appropriate and respectful.</li>
  <li><strong>Review and Revise:</strong> Always review your letter for any grammatical or vocabulary errors and ensure your message is clear and concise before submission.</li>
</ol>
<p>Following these guidelines can significantly enhance the effectiveness of your response and improve your overall performance in IELTS General Training Task 1.</p>
`,

  "ielts-general-task2": `
<p><strong>IELTS General Training Task 2 Rubric Overview</strong></p>
<p>IELTS General Training Task 2 rubric evaluates the candidate's ability to express and justify opinions, discuss arguments, and engage in a written discussion on a variety of everyday topics, such as social, educational, or general lifestyle issues.</p>
<p><strong>Objectives of the Rubric</strong></p>
<ul>
  <li>To assess the ability to construct a clear, relevant, well-organized argument or discussion.</li>
  <li>To evaluate the effectiveness of the response in expressing and supporting viewpoints.</li>
  <li>To measure the range and accuracy of vocabulary and grammatical structures used.</li>
</ul>
<p><strong>Evaluation Criteria</strong></p>
<ul>
  <li><strong>Task Response:</strong> How well the candidate develops and supports their arguments or discussions in relation to the task requirements.</li>
  <li><strong>Coherence and Cohesion:</strong> The clarity of the writing and the logical flow of ideas, as well as the usage of cohesive devices.</li>
  <li><strong>Lexical Resource:</strong> The range and appropriateness of the vocabulary used, and how effectively vocabulary is used to express ideas and achieve precise meanings.</li>
  <li><strong>Grammatical Range and Accuracy:</strong> The accuracy and range of grammatical constructions used are critically assessed.</li>
</ul>
<p><strong>Tips for Maximizing Scores</strong></p>
<ol>
  <li><strong>Address All Parts of the Task:</strong> Respond to all parts of the question thoroughly, providing a balanced discussion where required.</li>
  <li><strong>Structure Your Essay:</strong> Plan and organize your essay into clear paragraphs, each focusing on a specific point or argument.</li>
  <li><strong>Vary Your Language:</strong> Use a wide range of vocabulary and grammatical structures to demonstrate language proficiency.</li>
  <li><strong>Proofread:</strong> Review your writing for potential errors and to enhance clarity and coherence of your arguments.</li>
</ol>
<p>By following these guidelines and focusing on the detailed criteria of the rubric, candidates can effectively improve their performance in IELTS General Training Task 2.</p>
`,

  informative: `
<p><strong>Informative Writing Rubric Overview</strong></p>
<p>The informative writing rubric is designed to assess students' ability to convey information clearly and accurately. The focus is on the effective communication of factual, unbiased content organized in a logical and cohesive manner.</p>
<p><strong>Objectives of the Rubric</strong></p>
<ul>
  <li>To evaluate the accuracy and clarity of information presented.</li>
  <li>To assess the organization and structure of the text, ensuring it enhances understanding.</li>
  <li>To measure the use of appropriate and precise vocabulary that supports the informational content.</li>
</ul>
<p><strong>Evaluation Criteria</strong></p>
<ul>
  <li><strong>Content Accuracy:</strong> The accuracy of the information provided and its relevance to the topic.</li>
  <li><strong>Organizational Structure:</strong> The logical arrangement of ideas and use of paragraphs to structure the text effectively.</li>
  <li><strong>Language Use:</strong> The appropriateness and precision of vocabulary and grammar to communicate information clearly and effectively.</li>
  <li><strong>Engagement and Style:</strong> The ability to engage the reader with a clear, objective, and interesting presentation of the topic.</li>
</ul>
<p><strong>Tips for Maximizing Scores</strong></p>
<ol>
  <li><strong>Research Thoroughly:</strong> Ensure all facts are accurate and derived from reliable sources to support the credibility of the information.</li>
  <li><strong>Organize Logically:</strong> Plan the structure of your writing to present information in a logical order that enhances the reader's understanding.</li>
  <li><strong>Use Precise Language:</strong> Select specific and accurate vocabulary to convey information without ambiguity.</li>
  <li><strong>Revise for Clarity:</strong> Review and edit your writing to ensure that information is presented as clearly and concisely as possible.</li>
</ol>
<p>Adhering to the standards set by this rubric will help students effectively communicate information and improve their informative writing skills.</p>
`,

  persuasive: `
<p><strong>Persuasive Writing Rubric Comprehensive Overview</strong></p>
<p>The Persuasive Writing Rubric is designed to evaluate the effectiveness of argumentative essays. It focuses on the argument's clarity, the evidence provided, and the persuasiveness of the rhetoric used.</p>
<p><strong>Core Evaluation Criteria</strong></p>
<ul>
  <li><strong>Argument Clarity:</strong> Measures how clearly and strongly the thesis statement presents the main argument, including its defensibility and originality.</li>
  <li><strong>Evidence and Support:</strong> Assesses the quality and relevance of the evidence and examples used to support the argument. This includes the appropriateness of the sources and how effectively they are integrated into the argument.</li>
  <li><strong>Organization and Structure:</strong> Evaluates the logical flow of the essay, including the introduction, body, and conclusion. The organization should enhance the persuasiveness of the argument.</li>
  <li><strong>Language and Style:</strong> Reviews the effectiveness of the language choices, persuasive techniques, and overall style in enhancing the argument's persuasiveness.</li>
  <li><strong>Grammar and Syntax:</strong> Considers the accuracy and complexity of grammatical structures and the proper use of punctuation and syntax, contributing to clear and effective communication.</li>
</ul>
<p><strong>Strategies for Maximizing Scores</strong></p>
<ol>
  <li><strong>Develop a Strong Thesis:</strong> Start with a compelling and debatable thesis. Ensure that your thesis statement clearly defines your position and outlines the arguments you will discuss.</li>
  <li><strong>Use Robust Evidence:</strong> Support your arguments with substantial evidence from credible sources. Diversify your support by using statistics, quotes, and real-life examples.</li>
  <li><strong>Structure Your Essay Effectively:</strong> Organize your essay in a way that each paragraph logically flows to the next, with clear transitions and each supporting point building on the previous one.</li>
  <li><strong>Employ Persuasive Techniques:</strong> Use rhetorical strategies such as pathos, logos, and ethos effectively. Appeal to the reader’s emotions, logic, and sense of ethics to enhance your persuasiveness.</li>
  <li><strong>Revise and Edit:</strong> Always take the time to revise your essay. Check for logical flow, argument strength, and grammatical accuracy. Editing and revising are critical for producing a polished and persuasive essay.</li>
</ol>
<p>Adhering to these criteria and employing these strategies will significantly enhance the effectiveness of your persuasive writing, ensuring that your arguments are compelling and persuasive.</p>
`,

  paragraph: `
<p><strong>Understanding and Utilizing the Paragraph Rubric</strong></p>
<p>The paragraph rubric is designed to assist educators and learners by providing a structured framework for assessing paragraph writing. Its primary goal is to ensure consistent and objective evaluations across various key aspects of writing:</p>
<ul>
  <li><strong>Organization:</strong> Evaluates how logically ideas are structured and whether the paragraphing effectively supports the presentation of ideas.</li>
  <li><strong>Content & Coherence:</strong> Focuses on the logical flow and connection of ideas, ensuring that the content is coherent and arguments are well-developed.</li>
  <li><strong>Grammar:</strong> Assesses the accuracy of the grammar used, emphasizing the importance of grammatical precision in clear communication.</li>
  <li><strong>Vocabulary:</strong> Reviews the range and appropriateness of the vocabulary used, which enhances the clarity and richness of the writing.</li>
</ul>
<p><strong>To maximize the effectiveness of the rubric, consider the following practices:</strong></p>
<ol>
  <li><strong>Clear Objectives:</strong> Before using the rubric, clarify what you are assessing. Make sure students understand the criteria as well, which can help them know what to strive for in their writing.</li>
  <li><strong>Consistent Application:</strong> Apply the rubric consistently across all students to maintain fairness. Consistency in grading also helps in accurately measuring student progress over time.</li>
  <li><strong>Detailed Feedback:</strong> Use the specific categories in the rubric to provide detailed feedback. This helps students understand their strengths and pinpoint areas that require improvement.</li>
  <li><strong>Reflection and Revision:</strong> Encourage students to use the feedback to revise their paragraphs. Revision based on rubric feedback can significantly improve their writing skills and understanding of good writing practices.</li>
  <li><strong>Training and Calibration:</strong> If multiple educators are using the same rubric, consider a calibration session to align on how to interpret and apply the criteria. This prevents discrepancies in evaluations and ensures that all students are graded on an equal footing.</li>
</ol>
<p><strong>Strategies for Maximizing Scores</strong></p>
<ul>
  <li><strong>Pre-writing Planning:</strong> Spend adequate time planning the paragraph structure before writing to ensure a logical flow and strong organization.</li>
  <li><strong>Practice Writing:</strong> Regular practice can help improve both speed and familiarity with different writing styles and topics.</li>
  <li><strong>Peer Reviews:</strong> Engage in peer reviews to receive constructive feedback and gain different perspectives on your writing.</li>
  <li><strong>Focus on Grammar and Vocabulary:</strong> Continuously work on enhancing grammar and vocabulary to reduce errors and improve expression clarity.</li>
</ul>
<p>By integrating these strategies, students can significantly improve their ability to meet and exceed the criteria set forth in the paragraph rubric, ultimately achieving higher scores and better overall writing proficiency.</p>
`,
};

export default rubricContents;
