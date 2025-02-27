import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Comment, Answer, Question, VoteData } from '../types';
import useUserContext from './useUserContext';
import { addComment } from '../services/commentService';
import { getQuestionById } from '../services/questionService';
import { updateAnswerCorrect } from '../services/answerService';

/**
 * Custom hook for managing the answer page's state, navigation, and real-time updates.
 *
 * @returns questionID - The current question ID retrieved from the URL parameters.
 * @returns question - The current question object with its answers, comments, and votes.
 * @returns handleNewComment - Function to handle the submission of a new comment to a question or answer.
 * @returns handleNewAnswer - Function to navigate to the "New Answer" page
 */
const useAnswerPage = () => {
  const { qid } = useParams();
  const navigate = useNavigate();

  const { user, socket } = useUserContext();
  const [questionID, setQuestionID] = useState<string>(qid || '');
  const [question, setQuestion] = useState<Question | null>(null);

  /**
   * Function to handle navigation to the "New Answer" page.
   */
  const handleNewAnswer = () => {
    navigate(`/new/answer/${questionID}`);
  };

  useEffect(() => {
    if (!qid) {
      navigate('/home');
      return;
    }

    setQuestionID(qid);
  }, [qid, navigate]);

  /**
   * Function to handle the submission of a new comment to a question or answer.
   *
   * @param comment - The comment object to be added.
   * @param targetType - The type of target being commented on, either 'question' or 'answer'.
   * @param targetId - The ID of the target being commented on.
   */
  const handleNewComment = async (
    comment: Comment,
    targetType: 'question' | 'answer',
    targetId: string | undefined,
  ) => {
    try {
      if (targetId === undefined) {
        throw new Error('No target ID provided.');
      }

      await addComment(targetId, targetType, comment);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adding comment:', error);
    }
  };

  const handleAnswerCorrect = async (ans: Answer) => {
    try {
      if (!qid) {
        throw new Error('Question ID is undefined.');
      }
      await updateAnswerCorrect(qid, ans);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marking answer as correct:', error);
    }
  };

  useEffect(() => {
    /**
     * Function to fetch the question data based on the question ID.
     */
    const fetchData = async () => {
      try {
        const res = await getQuestionById(questionID, user.username);
        setQuestion(res || null);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching question:', error);
      }
    };

    // eslint-disable-next-line no-console
    fetchData().catch(e => console.log(e));
  }, [questionID, user.username]);

  useEffect(() => {
    /**
     * Function to handle updates to the answers of a question.
     *
     * @param answer - The updated answer object.
     */
    const handleAnswerUpdate = ({
      qid: id,
      answer,
      removed,
    }: {
      qid: string;
      answer: Answer;
      removed: boolean;
    }) => {
      // if (id === questionID && !removed) {
      //   setQuestion(prevQuestion =>
      //     prevQuestion
      //       ? // Creates a new Question object with the new answer appended to the end
      //         {
      //           ...prevQuestion,
      //           answers: [...prevQuestion.answers, answer].filter(
      //             ans =>
      //               ans._id !== answer._id ||
      //               (Number(ans.pinned) - Number(answer.pinned) === 0 &&
      //                 Number(ans.locked) - Number(answer.locked) === 0),
      //           ),
      //         }
      //       : prevQuestion,
      //   );
      // } else if (id === questionID) {
      //   setQuestion(prevQuestion =>
      //     prevQuestion
      //       ? // Creates a new Question object with the new answer appended to the end
      //         {
      //           ...prevQuestion,
      //           answers: prevQuestion.answers.filter(ans => ans._id !== answer._id),
      //         } //
      //       : // prevQuestion.answers.filter((ans) => ans._id !== answer._id)
      //         prevQuestion,
      //   );
      // }
      if (id === questionID) {
        setQuestion(prevQuestion =>
          prevQuestion
            ? {
                ...prevQuestion,
                answers: removed
                  ? // Filter out the removed answer
                    prevQuestion.answers.filter(ans => ans._id !== answer._id)
                  : // Map to update or add the answer without duplicating
                    prevQuestion.answers.map(ans => (ans._id === answer._id ? answer : ans)),
              }
            : prevQuestion,
        );
      }
    };

    /**
     * Function to handle updates to the comments of a question or answer.
     *
     * @param result - The updated question or answer object.
     * @param type - The type of the object being updated, either 'question' or 'answer'.
     */
    const handleCommentUpdate = ({
      result,
      type,
    }: {
      result: Question | Answer;
      type: 'question' | 'answer';
    }) => {
      if (type === 'question') {
        const questionResult = result as Question;

        if (questionResult._id === questionID) {
          setQuestion(questionResult);
        }
      } else if (type === 'answer') {
        setQuestion(prevQuestion =>
          prevQuestion
            ? // Updates answers with a matching object ID, and creates a new Question object
              {
                ...prevQuestion,
                answers: prevQuestion.answers.map(a =>
                  a._id === result._id ? (result as Answer) : a,
                ),
              }
            : prevQuestion,
        );
      }
    };

    /**
     * Function to handle updates to the views of a question.
     *
     * @param q The updated question object.
     */
    const handleViewsUpdate = (q: Question) => {
      if (q._id === questionID) {
        setQuestion(q);
      }
    };

    /**
     * Function to handle vote updates for a question.
     *
     * @param voteData - The updated vote data for a question
     */
    const handleVoteUpdate = (voteData: VoteData) => {
      if (voteData.qid === questionID) {
        setQuestion(prevQuestion =>
          prevQuestion
            ? {
                ...prevQuestion,
                upVotes: [...voteData.upVotes],
                downVotes: [...voteData.downVotes],
              }
            : prevQuestion,
        );
      }
    };

    const handleQuestionRepaint = ({ quest, removed }: { quest: Question; removed: boolean }) => {
      if (quest._id === questionID) {
        if (removed) {
          navigate('/home');
          return;
        }
        setQuestion(prevQuestion =>
          prevQuestion
            ? {
                ...prevQuestion,
                pinned: quest.pinned,
                locked: quest.locked,
              }
            : prevQuestion,
        );
      }
    };

    socket.on('answerUpdate', handleAnswerUpdate);
    socket.on('viewsUpdate', handleViewsUpdate);
    socket.on('commentUpdate', handleCommentUpdate);
    socket.on('voteUpdate', handleVoteUpdate);
    socket.on('questionUpdate', handleQuestionRepaint);

    return () => {
      socket.off('answerUpdate', handleAnswerUpdate);
      socket.off('viewsUpdate', handleViewsUpdate);
      socket.off('commentUpdate', handleCommentUpdate);
      socket.off('voteUpdate', handleVoteUpdate);
      socket.off('questionUpdate', handleQuestionRepaint);
    };
  }, [navigate, qid, questionID, socket]);

  return {
    questionID,
    question,
    handleNewComment,
    handleNewAnswer,
    handleAnswerCorrect,
  };
};

export default useAnswerPage;
