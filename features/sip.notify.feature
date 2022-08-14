Feature: Sip gateway notify =>
  mMCU originates messages towards mUCC

  @nightly
  @notify
  Scenario: RTP inactivity
  """
  sip notify send BYE for close connection after 60 seconds without RTP
  """
    Given System is running on MCU_HOME
    Given create conference 100091
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |
      | chandler    | context   | audio         |
    #starts internal timer for validation and continues to nest step
    Then validate participant chandler BYE in audio room
    #wait for user inactivity timer (mMCU)
    Then Sleep 60 sec
    #starts internal timer for validation and continues to nest step
    Then validate audio room BYE
    #wait for room to be finally closed by server (mMCU)
    Then Sleep 240 sec
    Then Failed destroy audio room







