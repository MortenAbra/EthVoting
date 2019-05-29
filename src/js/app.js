App =
    {
        web3Provider: null,
        contracts: {},
        account: '0x0',
        hasVoted: false,

        init: function () {
            console.log("Initializing web3 provider");
            return App.loadWeb3Provider();
        },

        loadWeb3Provider: function () {
            if (typeof web3 !== 'undefined') {
                // If a web3 instance is already provided by Meta Mask.
                App.web3Provider = web3.currentProvider;
                web3 = new Web3(web3.currentProvider);
                console.log("web3 instance already provided");
                ethereum.enable();
            } else {
                // Specify default instance if no web3 instance provided
                App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
                web3 = new Web3(App.web3Provider);
                console.log("No web3 instance provided - Starting instance now...");
                ethereum.enable();
            }
            console.log("Loading contract..");
            return App.loadContracts();
        },

        loadContracts: function () {
            $.getJSON("Ballot.json", function (ballot) {
                // Instantiate a new truffle contract from the artifact
                App.contracts.Ballot = TruffleContract(ballot);
                // Connect provider to interact with contract
                App.contracts.Ballot.setProvider(App.web3Provider);

                App.EventListener();
                console.log("Contract loaded!");
                return App.loadData();
            });
        },

        // Listen for events emitted from the contract
        EventListener: function () {
            App.contracts.Ballot.deployed().then(function (instance) {
                instance.VotedEvent({}, {
                    fromBlock: 'latest',
                    toBlock: 'latest'
                }).watch(function (error, event) {
                    console.log("triggered an event", event);
                    // Reload when a new vote is recorded
                    App.loadData();
                    console.log("Reloading after new vote");
                });
            });
        },


        loadData: function () {
            var ballot;
            var loading = $('#loader');
            var renderContent = $('#content');


            // Loading the account data
            web3.eth.getCoinbase(function (err, account) {
                if (err === null) {
                    App.account = account;
                    $('#accountAddress').html("Account id: " + account);
                    web3.eth.getBalance(account, function (err, balance) {
                        if(err === null) {
                            $("#accountBalance").text("Account Balance: " + web3.fromWei(balance, "ether") + " ETH");
                        }
                    });
                }
            });



            // Load contract data
            App.contracts.Ballot.deployed().then(function (instance) {
                ballot = instance;
                return ballot.totalCandidates();
            }).then(function (totalCandidates) {
                // Store all promised to get candidate info
                const promises = [];
                for (var i = 1; i <= totalCandidates; i++) {
                    promises.push(ballot.candidates(i));
                }

                // Once all candidates are received, add to dom
                Promise.all(promises).then((candidates) => {
                    var results = $("#results");
                    results.empty();

                    var selectCandidate = $('#selectCandidate');
                    //selectCandidate.empty();

                    candidates.forEach(candidate => {
                        var candidateID = candidate[0];
                        var candidateName = candidate[1];
                        var candidateVotes = candidate[2];


                        // Render candidate Result
                        var resultsRenderTemplate = "<tr><th>" + candidateID + "</th><td>" + candidateName + "</td><td>" + candidateVotes + "</td></tr>"
                        results.append(resultsRenderTemplate);

                        // Render candidate ballot option
                        var ballotOptionRender = "<option value='" + candidateID + "' >" + candidateName + "</option>"
                        selectCandidate.append(ballotOptionRender);
                    })
                });

                return ballot.voters(App.account);
            }).then(function (hasVoted) {
                // Do not allow a user to vote
                if (hasVoted) {
                    $('form').hide();

                }
                loading.hide();
                renderContent.show();
            }).catch(function (error) {
                console.warn(error);
            });
        },

        candidateVote: function () {
            var candidateId = $('#selectCandidate').val();
            App.contracts.Ballot.deployed().then(function (instance) {
                return instance.candidateVote(candidateId, {from: App.account});
            }).then(function (result) {
                // Wait for votes to update
                $("#content").hide();
                $("#loader").show();
            }).catch(function (err) {
                console.error(err);
            })
        }
    }

$(function () {
    $(window).load(function () {
        App.init();
    });
});
