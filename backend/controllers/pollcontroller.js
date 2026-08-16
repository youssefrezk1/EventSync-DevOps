import { Poll ,} from '../models/Poll.js'; // Update path as needed
import { RegisterBooth } from '../models/RegisterBooth.js'; // Update path as needed

export const createPoll = async (req, res) => {
  try {
    const { boothIds } = req.body;

    // Validate input
    if (!boothIds || !Array.isArray(boothIds) || boothIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 booth IDs are required to create a poll',
      });
    }

    // Verify all booths exist
    const booths = await RegisterBooth.find({ _id: { $in: boothIds } });
    
    if (booths.length !== boothIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more booth IDs are invalid',
      });
    }

    // Create poll with events array containing all booths
    const events = boothIds.map(boothId => ({
      booth: boothId,
      count: 0,
    }));

    const newPoll = await Poll.create({
      Events: events,
    });

    // Populate booth details for response
    const populatedPoll = await Poll.findById(newPoll._id).populate({
      path: 'Events.booth',
      select: 'VendorID Location BoothSize StartDate EndDate',
      populate: {
        path: 'VendorID',
        select: 'companyName email',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      data: populatedPoll,
    });
  } catch (error) {
    console.error('❌ Error in createPoll:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating poll',
    });
  }
};

// Optional: Get all polls
export const getAllPolls = async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate({
        path: 'Events.booth',
        select: 'VendorID Location BoothSize StartDate EndDate',
        populate: {
          path: 'VendorID',
          select: 'companyName email',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: polls.length,
      data: polls,
    });
  } catch (error) {
    console.error('❌ Error in getAllPolls:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching polls',
    });
  }
};

// Optional: Get single poll
export const getPollById = async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id).populate({
      path: 'Events.booth',
      select: 'VendorID Location BoothSize StartDate EndDate',
      populate: {
        path: 'VendorID',
        select: 'companyName email',
      },
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    res.status(200).json({
      success: true,
      data: poll,
    });
  } catch (error) {
    console.error('❌ Error in getPollById:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching poll',
    });
  }
};

// Optional: Vote on a poll
import { Vote } from '../models/Vote.js';


export const voteOnPoll = async (req, res) => {
  try {
    const { pollId, boothId } = req.body;
    const userId = req.id; // From requireAuth middleware
    const userRole = req.role; // From requireAuth middleware

    // Validation
    if (!pollId || !boothId) {
      return res.status(400).json({
        success: false,
        message: 'Poll ID and Booth ID are required',
      });
    }

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Only students and staff can vote
    const allowedRoles = ['student', 'Staff', 'Professor', 'TA'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only students and staff members can vote on polls',
      });
    }

    // Normalize userType for Vote model (Staff, Professor, TA all map to 'Staff')
    const userType = userRole === 'student' ? 'Student' : 'Staff';

    // Check if poll exists
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    // Verify booth exists in this poll
    const eventIndex = poll.Events.findIndex(
      (event) => event.booth.toString() === boothId
    );

    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found in this poll',
      });
    }

    // Check if user already voted in this poll
    const existingVote = await Vote.findOne({ 
      poll: pollId, 
      user: userId,
      userType: userType
    });

    if (existingVote) {
      // User is changing their vote
      const oldBoothId = existingVote.booth.toString();
      
      if (oldBoothId === boothId) {
        // User clicked the same booth - don't allow re-voting
        return res.status(400).json({
          success: false,
          message: 'You have already voted for this booth',
        });
      }

      // Decrement count from old booth
      const oldEventIndex = poll.Events.findIndex(
        (event) => event.booth.toString() === oldBoothId
      );
      
      if (oldEventIndex !== -1 && poll.Events[oldEventIndex].count > 0) {
        poll.Events[oldEventIndex].count -= 1;
      }

      // Increment count for new booth
      poll.Events[eventIndex].count += 1;

      // Update the vote record
      existingVote.booth = boothId;
      existingVote.votedAt = new Date();
      await existingVote.save();
      await poll.save();

      const updatedPoll = await Poll.findById(pollId).populate({
        path: 'Events.booth',
        select: 'VendorID Location BoothSize StartDate EndDate SetupDuration',
        populate: {
          path: 'VendorID',
          select: 'companyName email',
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Vote changed successfully',
        data: updatedPoll,
        voteChanged: true,
      });
    } else {
      // New vote
      await Vote.create({
        poll: pollId,
        user: userId,
        userType: userType,
        booth: boothId,
      });

      // Increment count for booth
      poll.Events[eventIndex].count += 1;
      await poll.save();

      const updatedPoll = await Poll.findById(pollId).populate({
        path: 'Events.booth',
        select: 'VendorID Location BoothSize StartDate EndDate SetupDuration',
        populate: {
          path: 'VendorID',
          select: 'companyName email',
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Vote recorded successfully',
        data: updatedPoll,
        voteChanged: false,
      });
    }
  } catch (error) {
    console.error('❌ Error in voteOnPoll:', error);
    
    // Handle duplicate vote error from unique index
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while voting',
    });
  }
};
export const deletePoll = async (req, res) => {
  try {
    console.log('Delete poll request received');
    const { id } = req.params;

    // Check if poll exists
    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    // Delete all votes related to this poll
    await Vote.deleteMany({ poll: id });

    // Delete the poll itself
    await Poll.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Poll deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error in deletePoll:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting poll',
    });
  }
};