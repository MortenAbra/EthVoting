pragma solidity 0.4.25;

contract Ballot {

    //Defining a Candidate
    struct Candidate {
        uint candidateID;
        string candidateName;
        uint candidateVotes;
    }

    //Storing all Candidates in the election
    mapping(uint => Candidate) public candidates;

    //Storing all accounts which has voted
    mapping(address => bool) public voters;


    uint public totalCandidates;



    function addCandidate (string _name) private {
        totalCandidates++;
        candidates[totalCandidates] = Candidate(totalCandidates, _name, 0);
    }


    constructor () public {
        addCandidate("Morten");
        addCandidate("Mads");
        addCandidate("Dennis");
    }

    function candidateVote (uint _id) public {

        require(!voters[msg.sender]);

        require(_id > 0 && _id <= totalCandidates);

        voters[msg.sender] = true;

        candidates[_id].candidateVotes++;

        emit VotedEvent(_id);
    }

    event VotedEvent (uint indexed _id);

}
