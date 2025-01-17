pragma solidity 0.4.25;

contract Ballot {

    //Defining a Candidate
    struct Candidate {
        uint candidateID;
        string candidateName;
        uint candidateVotes;
    }

    struct Voter {
        bool authorized;
        bool voted;
        uint vote;
    }

    //Mapping of both candidates and voters
    //Both stores each representive key type and value type
    mapping(uint => Candidate) public candidates;
    mapping(address => Voter) public voters;

    //Amount of candidates
    uint public totalCandidates;
    address public owner;

    modifier ownerOnly(){
        require(msg.sender == owner);
        _;
    }

    //Function to add new candidates
    function newCandidate(string _name) public {
        require(voters[msg.sender].authorized == true);
        totalCandidates += 1;
        candidates[totalCandidates] = Candidate(totalCandidates, _name, 0);
    }

    function authorize(address _person) public {
        require(voters[_person].authorized == false);
        voters[_person].authorized = true;
    }


    //Function for voting on a candidate
    function candidateVote(uint _id) public {
        //Requires a voter not to have already voted
        require(!voters[msg.sender].voted);
        require(voters[msg.sender].authorized);
        //Needs a valid candidate for the voter to vote
        require(_id > 0 && _id <= totalCandidates);


        //Updates the number of votes for the candidate voted for
        candidates[_id].candidateVotes++;

        voters[msg.sender].voted = true;
        voters[msg.sender].vote += 1;

        //Triggering the voted event
        emit VotedEvent(_id);
    }

    event VotedEvent (uint indexed _id);

    //Constructor - Initialize new candidates to vote for
    constructor () public {
        owner = msg.sender;
        //authorize(0xea978991fbfa2ea664163d8e193c99a33c332bd9);
    }

    function endElection() ownerOnly public {
        selfdestruct(owner);
    }

}
