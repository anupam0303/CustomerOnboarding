Feature: Customer Onboarding
    Scenario: user posts customer onboarding info without tier information
        Given tier information is not in the request
        When user posts onboarding request
        Then endpoint should return 400

    Scenario: user posts valid customer onboarding
        Given user makes valid customer onboarding request
        When user posts onboarding request
        Then endpoint should return 200