Feature: MRF =>

  @MRF
  @TMU-26400
  Scenario: MRF sanity test
    Given System is running on MCU_HOME
    Given create conference 190001
    When create audio room for host dummy_user1
    And add participant dummy_user1 with meetingID context with userType MRF_USER with statusCode 183
    And update dummy_user1 with userType MRF_UPDATE with infoType PLAY
    And leave participant:
      | Participant | meetingID | roomType |
      | dummy_user1  | context   | audio    |
    Then destroy audio room
