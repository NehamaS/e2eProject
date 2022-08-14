Feature: mMCU Cluster Health - audio one-on-one =>


  @TMU-27752
  @headless
  @MCU-2634
  Scenario: create conference with name header
    Given System is running on MCU_HOME
    Given create conference 100029
    When create audio room for host chandler
    Then verify audio roomId NOT received in INFO

  @TMU-27566
  @headless
  @MCU-2634
  Scenario: create conference without name header and with record headers
    Given System is running on MCU_HOME
    Given create conference 100029
    When create audio room for host chandler with header RECORD is TRUE
    Then verify audio roomId DO received in INFO

  @TMU-27567
  @headless
  @MCU-2634
  Scenario: create conference without name header and without record headers
    Given System is running on MCU_HOME
    Given create conference 100030
    When create audio room for host chandler with header RECORD is FALSE
    Then verify audio roomId DO received in INFO

  @MCU-2645
  @TMU-27569
  Scenario: add users without create conference with recording header
    Given System is running on MCU_HOME
    Given create conference 100028
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Chandler with meetingId context and audio roomType
    And participant Chandler send create conference INFO on audio room
    And JOIN participant Chandler with meetingId context and roomType audio
    When INVITE participant Ross with meetingId context and audio roomType
    And JOIN participant Ross with meetingId context and roomType audio
    Then Sleep 5 sec in case STREAM set to TRUE
    Then destroy audio room with meetingId context for host Chandler

  @MCU-2645
  @TMU-28586
  Scenario: add users without create conference with recording header with leave participants
    Given System is running on MCU_HOME
    Given create conference 100029
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Chandler with meetingId context and audio roomType
    And participant Chandler send create conference INFO on audio room
    And JOIN participant Chandler with meetingId context and roomType audio
    When INVITE participant Ross with meetingId context and audio roomType
    And JOIN participant Ross with meetingId context and roomType audio
    Then Sleep 5 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType     |      caseType         |
      | Chandler    | context   | audio        | WITH_RECORDING_HEADER |
      | Ross        | context   | audio        | WITH_RECORDING_HEADER |
    Then destroy audio room with meetingId context for host Chandler



  @hold-resume
  @MCU-2907
  @TMU-31769
  Scenario: one on one - one user hold resume
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 100032
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Monica      | context   | audio    | audio1     |
    Then Sleep 5 sec in case STREAM set to TRUE
    And Monica reInvite in audio-video roomType as sendonly
    And Monica reInvite in audio-video roomType as sendrecv
    And Monica reInvite in audio roomType as recvonly
    And Monica reInvite in audio-video roomType as sendrecv
    Then destroy audio room with meetingId context for host Monica

  @hold-resume
  @MOH
  @MCU-2907
  @TMU-31770
  Scenario: one on one - one user play music on hold
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 100032
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Ross with meetingId context and audio roomType
    And participant Ross send create conference INFO on audio room
    And JOIN participant Ross with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Ross      | context   | audio    | audio1     |
    Then Sleep 5 sec in case STREAM set to TRUE
    And Ross reInvite in audio-video roomType as recvonly
    And participant Ross send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then validate INFO is received after 5 sec for Ross with messageIndex 1 and name: moml.exit play.amt: 3646 and play.end: play.complete
    Then validate INFO is received after 5 sec for Ross with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Ross reInvite in audio-video roomType as sendrecv
    And Ross reInvite in audio roomType as recvonly
    And participant Ross send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then validate INFO is received after 5 sec for Ross with messageIndex 1 and name: moml.exit play.amt: 3646 and play.end: play.complete
    Then validate INFO is received after 5 sec for Ross with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Ross reInvite in audio-video roomType as sendrecv
    Then destroy audio room with meetingId context for host Ross

  @hold-resume
  @MOH
  @MCU-2907
  @TMU-31771
  Scenario: one on one - one user play music on hold not wait to end
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 100033
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Rachel with meetingId context and audio roomType
    And participant Rachel send create conference INFO on audio room
    And JOIN participant Rachel with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Rachel      | context   | audio    | audio1     |
    Then Sleep 5 sec in case STREAM set to TRUE
    And Rachel reInvite in audio-video roomType as recvonly
    And participant Rachel send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then Sleep 1 sec in case STREAM set to TRUE
    And Rachel reInvite in audio-video roomType as sendrecv
    Then validate INFO is received after 5 sec for Rachel with messageIndex 1 and name: moml.exit play.amt: <3646 and play.end: play.complete
    Then validate INFO is received after 5 sec for Rachel with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Rachel reInvite in audio roomType as recvonly
    And participant Rachel send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then validate INFO is received after 5 sec for Rachel with messageIndex 3 and name: moml.exit play.amt: 3646 and play.end: play.complete
    Then validate INFO is received after 5 sec for Rachel with messageIndex 4 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Rachel reInvite in audio-video roomType as sendrecv
    Then destroy audio room with meetingId context for host Rachel

  @hold-resume
  @MOH
  @MCU-2907
  @TMU-31772
  Scenario: one on one - two users play music on hold
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 100034
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Chandler with meetingId context and audio roomType
    And participant Chandler send create conference INFO on audio room
    And JOIN participant Chandler with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Chandler      | context   | audio    | audio1     |
      | Joey      | context   | audio    | audio1     |
    Then Sleep 5 sec in case STREAM set to TRUE
    And Chandler reInvite in audio-video roomType as sendonly
    And Joey reInvite in audio-video roomType as recvonly
    And participant Joey send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then Sleep 1 sec in case STREAM set to TRUE
    And Joey reInvite in audio-video roomType as sendrecv
    Then validate INFO is received after 5 sec for Chandler with messageIndex 1 and name: moml.exit play.amt: <3646 and play.end: play.complete
    Then validate INFO is received after 5 sec for Chandler with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Chandler reInvite in audio-video roomType as sendrecv
    Then destroy audio room with meetingId context for host Chandler




