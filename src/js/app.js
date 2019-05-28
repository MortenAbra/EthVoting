App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.loadWeb3Provider();
  },

  loadWeb3Provider: function () {

    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
      ethereum.enable();
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
      ethereum.enable();
    }
    return App.loadContracts();
  },

  loadContracts: function () {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.eventListener();

      return App.loadData();
    });
  },

  // Listen for events emitted from the contract
  eventListener: function () {
    App.contracts.Election.deployed().then(function(instance) {
      instance.votedEvent({}, {
        fromBlock: 'latest',
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.loadData();
      });
    });
  },

  loadData: function () {
    var electionContract;
    var loader = $("#loader");
    var content = $("#content");


    loader.show();
    content.hide();



    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Election.deployed().then(function (instance) {
      electionContract = instance;
      return electionContract.candidatesCount();
    }).then(function (candidatesCount) {

      // Store all promised to get candidate info
      const promises = [];
      for (var i = 1; i <= candidatesCount; i++) {
        promises.push(electionContract.candidates(i));
      }

      // Once all candidates are received, add to dom
      Promise.all(promises).then((candidates) => {
        var candidatesResults = $("#candidatesResults");
        candidatesResults.empty();

        var candidatesSelect = $('#candidatesSelect');
        candidatesSelect.empty();

        candidates.forEach(candidate => {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];



          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);




          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        })
      });

      return electionContract.voters(App.account);
    }).then(function (hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {
        $('form').hide();

      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  doVote: function () {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
