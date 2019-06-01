var Ballot = artifacts.require("Ballot");

contract("Ballot", function (accounts) {
    var app;

    it("Inits with 5 candidates", function () {
        return Ballot.deployed().then(function (instance) {
            return instance.totalCandidates();
        }).then(function (candidates) {
            assert.equal(candidates, 5);
        });
    });

    it('Candidate should have the correct name after creation', function () {
        return Ballot.deployed().then(function (instance) {
            app = instance;
            return app.candidates(1);
        }).then(function (candidate) {
            assert.equal(candidate[1], "Morten", "Correct name");
            return app.candidates(4);
        }).then(function (candidate) {
            assert.equal(candidate[1], "Lasse", "Correct name");
            return app.candidates(2);
        });
    });

    it('should have the 0 votes one creation', function () {
        return Ballot.deployed().then(function (instance) {
            app = instance;
            return app.candidates(2);
        }).then(function (candidate) {
            assert.isAbove(parseInt(candidate[2]), -1, "should have lower than 1 vote");
            return app.candidates(3);
        }).then(function (candidate) {
            assert.isBelow(parseInt(candidate[2]), 1, "should have lower than 1 vote");
        });
    });


});