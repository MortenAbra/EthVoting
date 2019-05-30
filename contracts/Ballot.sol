pragma solidity 0.4.25;

contract Ballot {

    //Defining a Candidate
    struct Candidate {
        uint candidateID;
        string candidateName;
        uint candidateVotes;
    }

    //Mapping of both candidates and voters
    //Both stores each representive key type and value type
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;

    //Amount of candidates
    uint public totalCandidates;


    //Function to add new candidates
    function newCandidate(string _name) private {
        totalCandidates+=1;
        candidates[totalCandidates] = Candidate(totalCandidates, _name, 0);
    }

    //Function for voting on a candidate
    function candidateVote (uint _id) public {
        //Requires a voter not to have already voted
        require(!voters[msg.sender]);
        //Needs a valid candidate for the voter to vote
        require(_id > 0 && _id <= totalCandidates);

        //Voter has now voted
        voters[msg.sender] = true;

        //Updates the number of votes for the candidate voted for
        candidates[_id].candidateVotes++;

        //Triggering the voted event
        emit VotedEvent(_id);
    }

    event VotedEvent (uint indexed _id);

    //Constructor - Initialize new candidates to vote for
    constructor () public {
        newCandidate("Morten");
        newCandidate("Mads");
        newCandidate("Dennis");
    }

}
