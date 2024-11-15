import React from 'react';
import './index.css';
import { handleHyperlink } from '../../../../tool';

/**
 * Interface representing the props for the QuestionBody component.
 *
 * - views - The number of views the question has received.
 * - text - The content of the question, which may contain hyperlinks.
 * - askby - The username of the user who asked the question.
 * - meta - Additional metadata related to the question, such as the date and time it was asked.
 */
interface QuestionBodyProps {
  views: number;
  text: string;
  askby: string;
  meta: string;
  pinned: boolean;
  locked: boolean;
}

/**
 * QuestionBody component that displays the body of a question.
 * It includes the number of views, the question content (with hyperlink handling),
 * the username of the author, and additional metadata.
 *
 * @param views The number of views the question has received.
 * @param text The content of the question.
 * @param askby The username of the question's author.
 * @param meta Additional metadata related to the question.
 */
const QuestionBody = ({ views, text, askby, meta, pinned, locked}: QuestionBodyProps) => {
  let questionClassName = 'questionBody right_padding';
  if(pinned) {
    questionClassName = questionClassName + ' pinned';
  }
  if(locked) {
    questionClassName = questionClassName + ' locked';
  }


  return <div id='questionBody' className={questionClassName}>
    <div className='bold_title answer_question_view'>{views} views</div>
    <div className='answer_question_text'>{handleHyperlink(text)}</div>
    <div className='answer_question_right'>
      <div className='question_author'>{askby}</div>
      <div className='answer_question_meta'>asked {meta}</div>
    </div>
  </div>
};

export default QuestionBody;
